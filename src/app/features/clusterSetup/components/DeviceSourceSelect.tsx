// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { AutoComplete } from 'antd';
import { Select } from '@app/components/Select';
import { useQuery } from '@tanstack/react-query';

import { getPhysicalStoragePoolByNode } from '@app/features/storagePool';
import { formatBytes } from '@app/utils/size';

export type DeviceSourceMode = 'new-device' | 'existing';

interface Props {
  mode: DeviceSourceMode;
  node?: string;
  value?: string;
  onChange?: (value?: string) => void;
  placeholder?: string;
}

export const DeviceSourceSelect: React.FC<Props> = ({ mode, node, value, onChange, placeholder }) => {
  const { data } = useQuery({
    queryKey: ['physicalStorage', node],
    queryFn: () => getPhysicalStoragePoolByNode({ node: node! }),
    enabled: mode === 'new-device' && !!node,
  });

  if (mode === 'new-device') {
    const options = (data?.data ?? [])
      .filter(
        (entry: any): entry is { device: string; size?: number } =>
          typeof entry?.device === 'string' && entry.device.length > 0,
      )
      .map((entry) => {
        const sizeLabel = typeof entry.size === 'number' ? ` (${formatBytes(entry.size / 1024)})` : '';
        return {
          value: entry.device,
          label: `${entry.device}${sizeLabel}`,
        };
      });
    return (
      <Select
        allowClear
        placeholder={placeholder ?? 'Select a block device'}
        options={options}
        value={value}
        onChange={onChange}
        style={{ width: '100%' }}
      />
    );
  }

  // existing mode — free-text dropdown for an already-prepared VG / thin pool
  // / ZFS pool name. LINSTOR has no REST endpoint that enumerates existing
  // pools that have not yet been registered with it, so the suggestion list
  // is intentionally empty — but the AutoComplete still looks like a clean
  // dropdown rather than a chip-style tags Select.
  return (
    <AutoComplete
      value={value}
      onChange={(v?: string) => onChange?.(v ?? '')}
      placeholder={placeholder ?? 'VG / thin pool (e.g. vg1/pool1)'}
      options={[]}
      style={{ width: '100%' }}
    />
  );
};
