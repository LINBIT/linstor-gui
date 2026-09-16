// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render } from '@testing-library/react';

import { SyncFlowOverlay } from '../SyncFlowOverlay';

// jsdom lays nothing out, so geometry comes from a stub: the container is
// 600x200 and each row sits at the top offset its data-row-key names.
const ROW_TOP: Record<string, number> = { 'node-1:0': 10, 'node-2:0': 60, 'node-3:0': 110 };

type Volume = React.ComponentProps<typeof SyncFlowOverlay>['volumes'][number];

const Harness = ({ volumes, laneX }: { volumes: Volume[]; laneX?: number }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  return (
    <div ref={ref} data-testid="container">
      {Object.keys(ROW_TOP).map((key) => (
        <div key={key} data-row-key={key} />
      ))}
      <SyncFlowOverlay containerRef={ref} volumes={volumes} laneX={laneX} />
    </div>
  );
};

// The overlay's layout effect runs before its parent's ref is attached; in a
// browser the ResizeObserver's first callback recomputes, but setupTests stubs
// that observer, so trigger the equivalent window resize listener.
const renderFlow = (ui: React.ReactElement) => {
  const result = render(ui);
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
  return result;
};

const paths = (container: HTMLElement) => Array.from(container.querySelectorAll('path.sync-flow-path-flow'));
const labels = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('text.sync-flow-label-text')).map((t) => t.textContent);

describe('SyncFlowOverlay', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const key = this.getAttribute('data-row-key');
      if (key && key in ROW_TOP) {
        return { top: ROW_TOP[key], height: 20, width: 600, left: 0, bottom: 0, right: 0, x: 0, y: 0, toJSON() {} };
      }
      return { top: 0, height: 200, width: 600, left: 0, bottom: 0, right: 0, x: 0, y: 0, toJSON() {} };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing while no volume is syncing', () => {
    const { container } = renderFlow(
      <Harness volumes={[{ node_name: 'node-1', volume_number: 0, state: { disk_state: 'UpToDate' } }]} />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it("draws one arrow from source to target with the target's percentage", () => {
    const { container } = renderFlow(
      <Harness
        volumes={[
          {
            node_name: 'node-1',
            volume_number: 0,
            state: { disk_state: 'UpToDate', replication_states: { 'node-2': { replication_state: 'SyncSource' } } },
          },
          {
            node_name: 'node-2',
            volume_number: 0,
            state: {
              disk_state: 'SyncTarget',
              replication_states: { 'node-1': { replication_state: 'SyncTarget', done_percentage: 42.4 } },
            },
          },
        ]}
      />,
    );
    const svg = container.querySelector('svg.sync-flow-overlay');
    expect(svg).toHaveAttribute('width', '600');
    expect(paths(container)).toHaveLength(1);
    // From row node-1 (mid 20) down to row node-2 (mid 70) along the lane.
    expect(paths(container)[0].getAttribute('d')).toMatch(/^M 86 20 C .* 86 70$/);
    expect(labels(container)).toEqual(['42%']);
  });

  it('fans two targets of one source out and labels each', () => {
    const { container } = renderFlow(
      <Harness
        laneX={100}
        volumes={[
          {
            node_name: 'node-1',
            volume_number: 0,
            state: {
              disk_state: 'UpToDate',
              replication_states: {
                'node-2': { replication_state: 'SyncSource', done_percentage: 10 },
                'node-3': { replication_state: 'SyncSource', done_percentage: 90 },
              },
            },
          },
          { node_name: 'node-2', volume_number: 0, state: { disk_state: 'SyncTarget' } },
          { node_name: 'node-3', volume_number: 0, state: { disk_state: 'SyncTarget' } },
        ]}
      />,
    );
    const d = paths(container).map((p) => p.getAttribute('d') ?? '');
    expect(d).toHaveLength(2);
    expect(d[0]).toMatch(/^M 100 20 C/);
    expect(d[1]).toMatch(/^M 100 20 C/);
    // The second curve bows further left than the first.
    const bowX = (path: string) => Number(path.split(' C ')[1].split(' ')[0]);
    expect(bowX(d[1])).toBeLessThan(bowX(d[0]));
    expect(labels(container)).toEqual(['10%', '90%']);
  });

  it('treats the primary as the implicit source of an inconsistent peer, sized by allocation', () => {
    const { container } = renderFlow(
      <Harness
        volumes={[
          { node_name: 'node-1', volume_number: 0, primary_node: 'node-1', state: { disk_state: 'UpToDate' } },
          {
            node_name: 'node-3',
            volume_number: 0,
            allocated_size_kib: 250,
            size_kib: 1000,
            state: { disk_state: 'Inconsistent' },
          },
        ]}
      />,
    );
    expect(paths(container)).toHaveLength(1);
    expect(paths(container)[0].getAttribute('d')).toMatch(/^M 86 20 C .* 86 120$/);
    expect(labels(container)).toEqual(['25%']);
  });

  it('skips edges whose rows are not on the page', () => {
    const { container } = renderFlow(
      <Harness
        volumes={[
          {
            node_name: 'node-9',
            volume_number: 0,
            state: { disk_state: 'SyncTarget', replication_states: { 'node-1': { replication_state: 'SyncTarget' } } },
          },
        ]}
      />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });
});
