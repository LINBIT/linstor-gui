// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import './SyncFlowOverlay.css';

type ReplicationState = {
  replication_state?: string;
  done_percentage?: number;
};

type Volume = {
  node_name?: string;
  volume_number?: number;
  allocated_size_kib?: number;
  size_kib?: number;
  /** Set by OverviewList when this volume's parent resource is in use (Primary). */
  primary_node?: string;
  state?: {
    disk_state?: string;
    replication_states?: Record<string, ReplicationState | undefined>;
  };
};

const INCONSISTENT_STATES = new Set(['Inconsistent', 'Outdated']);

const findPrimary = (volumes: Volume[]): Volume | undefined =>
  volumes.find((v) => v?.primary_node && v.primary_node === v.node_name);

const sizeBasedPercent = (volume?: Volume): number | null => {
  const allocated = volume?.allocated_size_kib;
  const total = volume?.size_kib;
  if (typeof allocated !== 'number' || typeof total !== 'number' || total <= 0) return null;
  return Math.max(0, Math.min(100, (allocated / total) * 100));
};

type Edge = {
  key: string;
  fromKey: string;
  toKey: string;
  percent: number | null;
};

type ResolvedPath = {
  key: string;
  d: string;
  labelX: number;
  labelY: number;
  sourceX: number;
  sourceY: number;
  percent: number | null;
};

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  volumes: Volume[];
  /** Horizontal position of the flow lane (px from container left). */
  laneX?: number;
}

const ARROW_MARKER_ID_BASE = 'sync-flow-arrow';

const collectEdges = (volumes: Volume[]): Edge[] => {
  // Real LINSTOR responses leave the SyncSource side's `disk_state` as
  // `UpToDate` (it already has the data) and only flag the relationship via
  // `replication_states`. So we walk every volume's replication_states map
  // and dedupe pairs.
  //
  // We pass over SyncTarget entries FIRST, because the target's
  // `done_percentage` ("I have received X%") is the figure shown in the
  // State column — picking the same number keeps the lane label consistent.
  // The SyncSource pass then fills in any pair the target side didn't
  // already cover.
  const byKey = new Map<string, Edge>();

  const addEdge = (fromKey: string, toKey: string, percent: number | null) => {
    const key = `${fromKey}->${toKey}`;
    if (byKey.has(key)) return;
    byKey.set(key, { key, fromKey, toKey, percent });
  };

  // Pass 1: SyncTarget side (authoritative percentage).
  for (const volume of volumes) {
    const replicationStates = volume?.state?.replication_states ?? {};
    const selfKey = `${volume.node_name}:${volume.volume_number}`;
    for (const [peer, info] of Object.entries(replicationStates)) {
      if (info?.replication_state !== 'SyncTarget') continue;
      const peerKey = `${peer}:${volume.volume_number}`;
      const percent = typeof info.done_percentage === 'number' ? info.done_percentage : null;
      addEdge(peerKey, selfKey, percent);
    }
  }

  // Pass 2: SyncSource side (only fills pairs the target didn't expose).
  for (const volume of volumes) {
    const replicationStates = volume?.state?.replication_states ?? {};
    const selfKey = `${volume.node_name}:${volume.volume_number}`;
    for (const [peer, info] of Object.entries(replicationStates)) {
      if (info?.replication_state !== 'SyncSource') continue;
      const peerKey = `${peer}:${volume.volume_number}`;
      const percent = typeof info.done_percentage === 'number' ? info.done_percentage : null;
      addEdge(selfKey, peerKey, percent);
    }
  }

  // Inconsistent / Outdated targets often appear before replication_states is
  // populated (sync hasn't started or just started). Treat the Primary row as
  // the implicit source so the user still sees that data is about to flow.
  const primary = findPrimary(volumes);
  if (primary) {
    const primaryKey = `${primary.node_name}:${primary.volume_number}`;
    for (const volume of volumes) {
      if (volume === primary) continue;
      const diskState = volume?.state?.disk_state;
      if (!diskState || !INCONSISTENT_STATES.has(diskState)) continue;
      const targetKey = `${volume.node_name}:${volume.volume_number}`;
      const fwdKey = `${primaryKey}->${targetKey}`;
      if (byKey.has(fwdKey)) continue;
      addEdge(primaryKey, targetKey, sizeBasedPercent(volume));
    }
  }

  return Array.from(byKey.values());
};

const findRowMidY = (container: HTMLElement, rowKey: string): number | null => {
  const row = container.querySelector(`[data-row-key="${CSS.escape(rowKey)}"]`);
  if (!row) return null;

  const containerRect = container.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();
  return rowRect.top - containerRect.top + rowRect.height / 2;
};

export const SyncFlowOverlay: React.FC<Props> = ({ containerRef, volumes, laneX = 86 }) => {
  const [paths, setPaths] = useState<ResolvedPath[]>([]);
  const [overlayDims, setOverlayDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const markerIdRef = useRef<string>(`${ARROW_MARKER_ID_BASE}-${Math.random().toString(36).slice(2, 9)}`);

  const compute = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    setOverlayDims({ width: containerRect.width, height: containerRect.height });

    const edges = collectEdges(volumes);

    // Group edges by source so multiple peers from the same node fan out
    // along distinct curves instead of stacking on top of each other.
    const groupedBySource = new Map<string, Edge[]>();
    for (const edge of edges) {
      const list = groupedBySource.get(edge.fromKey) ?? [];
      list.push(edge);
      groupedBySource.set(edge.fromKey, list);
    }

    const next: ResolvedPath[] = [];

    for (const [, sourceEdges] of groupedBySource) {
      sourceEdges.forEach((edge, index) => {
        const fromY = findRowMidY(container, edge.fromKey);
        const toY = findRowMidY(container, edge.toKey);
        if (fromY === null || toY === null) return;

        const dy = toY - fromY;
        // Each subsequent edge from the same source bows further out so the
        // curves stay visually distinct.
        const baseBow = Math.min(40, Math.max(22, Math.abs(dy) * 0.3));
        const bow = baseBow + index * 18;
        const cx = Math.max(8, laneX - bow);
        const cy1 = fromY + dy * 0.2;
        const cy2 = fromY + dy * 0.8;

        // Place each label near the bow apex (well to the left of the target
        // row), staggered horizontally per edge so multi-peer labels don't
        // stack on top of each other.
        const labelX = cx + 8;
        const labelY = (fromY + toY) / 2;

        next.push({
          key: edge.key,
          d: `M ${laneX} ${fromY} C ${cx} ${cy1}, ${cx} ${cy2}, ${laneX} ${toY}`,
          labelX,
          labelY,
          sourceX: laneX,
          sourceY: fromY,
          percent: edge.percent,
        });
      });
    }

    setPaths(next);
  }, [containerRef, volumes, laneX]);

  useLayoutEffect(() => {
    compute();
  }, [compute]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      compute();
    });
    observer.observe(container);

    const handleScroll = () => compute();
    window.addEventListener('resize', compute);
    container.addEventListener('scroll', handleScroll, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', compute);
      container.removeEventListener('scroll', handleScroll, true);
    };
  }, [compute, containerRef]);

  if (paths.length === 0 || overlayDims.width === 0) {
    return null;
  }

  const markerId = markerIdRef.current;

  return (
    <svg
      className="sync-flow-overlay"
      width={overlayDims.width}
      height={overlayDims.height}
      viewBox={`0 0 ${overlayDims.width} ${overlayDims.height}`}
      aria-hidden="true"
    >
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#1890ff" />
        </marker>
      </defs>

      {paths.map((p) => {
        const labelText = p.percent !== null ? `${p.percent.toFixed(0)}%` : null;
        return (
          <g key={p.key}>
            <path d={p.d} className="sync-flow-path-base" />
            <path d={p.d} className="sync-flow-path-flow" markerEnd={`url(#${markerId})`} />
            <circle cx={p.sourceX} cy={p.sourceY} r={4} className="sync-flow-source-pulse" />
            {labelText && (
              <>
                <rect
                  x={p.labelX - 21}
                  y={p.labelY - 10}
                  width={42}
                  height={20}
                  rx={5}
                  className="sync-flow-label-bg"
                />
                <text x={p.labelX} y={p.labelY + 1} className="sync-flow-label-text">
                  {labelText}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};
