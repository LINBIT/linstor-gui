// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Empty } from 'antd';
import { WarningFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { Link } from '@app/components/Link';
import { formatBytes } from '@app/utils/size';
import { normalizeStoragePoolSpace } from '@app/utils/storagePoolSpace';

/** A pool at or above this share used is flagged, with an icon and a label. */
export const NEARLY_FULL_PERCENT = 90;

export interface CapacityPool {
  storage_pool_name?: string;
  provider_kind?: string;
  total_capacity?: number;
  free_capacity?: number;
}

interface StoragePoolCapacityProps {
  node: string;
  pools: CapacityPool[];
  /** Prefix of the storage pool list route ('' or '/hci'). */
  routePrefix?: string;
}

const percentOf = (used: number, total: number) => (total > 0 ? Math.round((used / total) * 100) : 0);

/** One used-of-total line: the numbers in text, the share as a meter, and a flag when nearly full. */
const CapacityRow: React.FC<{ label: React.ReactNode; detail?: string; used: number; total: number; name: string }> = ({
  label,
  detail,
  used,
  total,
  name,
}) => {
  const { t } = useTranslation('node_detail');
  const percent = percentOf(used, total);
  const nearlyFull = percent >= NEARLY_FULL_PERCENT;

  return (
    <li className="py-2">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3">
        <span>
          {label}
          {detail && <span className="ml-2 text-xs text-(--text-secondary)">{detail}</span>}
        </span>
        <span className="tabular-nums">
          {formatBytes(used)} / {formatBytes(total)}
          {/* A pool in use reads as in use, even below one percent. */}
          <span className="ml-2 inline-block w-11 text-right font-semibold">
            {used > 0 && percent < 1 ? '<1' : percent}%
          </span>
        </span>
      </div>
      <div
        role="meter"
        aria-label={t('capacity_used', { name })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 overflow-hidden rounded-full bg-(--chart-meter-track)"
      >
        {/* At least a sliver once anything is used, so 17 MiB of 8 GiB is not drawn as empty. */}
        <div
          className="h-full rounded-full bg-(--chart-meter-fill)"
          style={{ width: `${Math.min(percent, 100)}%`, minWidth: used > 0 ? 4 : 0 }}
        />
      </div>
      {nearlyFull && (
        <div className="mt-1 inline-flex items-center gap-1.5 text-xs">
          <WarningFilled className="text-(--status-warning)" aria-hidden />
          {t('nearly_full')}
        </div>
      )}
    </li>
  );
};

/**
 * Used of total per storage pool on the node, then all of them together.
 * Diskless pools hold no data and are left out.
 */
export const StoragePoolCapacity: React.FC<StoragePoolCapacityProps> = ({ node, pools, routePrefix = '' }) => {
  const { t } = useTranslation('node_detail');
  const withStorage = pools.filter((p) => p.provider_kind !== 'DISKLESS' && p.storage_pool_name);

  if (withStorage.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('no_storage_pools')} />;
  }

  const rows = withStorage.map((p) => ({ pool: p, ...normalizeStoragePoolSpace(p.total_capacity, p.free_capacity) }));
  const used = rows.reduce((sum, r) => sum + r.used, 0);
  const total = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <>
      <ul className="m-0 list-none p-0">
        {rows.map(({ pool, used, total }) => (
          <CapacityRow
            key={pool.storage_pool_name}
            name={pool.storage_pool_name ?? ''}
            label={
              // The pool on this node: the same name exists on every node that has it.
              <Link
                to={`${routePrefix}/inventory/storage-pools?nodes=${encodeURIComponent(node)}&storage_pools=${encodeURIComponent(pool.storage_pool_name ?? '')}`}
              >
                {pool.storage_pool_name}
              </Link>
            }
            detail={pool.provider_kind}
            used={used}
            total={total}
          />
        ))}
      </ul>
      {rows.length > 1 && (
        <ul className="m-0 mt-1 list-none border-t border-(--border-subtle) p-0">
          <CapacityRow
            name={t('all_pools_on', { node })}
            label={<span className="font-semibold">{t('all_pools_on', { node })}</span>}
            used={used}
            total={total}
          />
        </ul>
      )}
    </>
  );
};
