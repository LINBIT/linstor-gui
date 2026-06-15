// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, expect, it } from 'vitest';

import { SERVICE_KEYS, getServicePreset } from '../presets';

describe('clusterSetup service presets', () => {
  it('exposes the two expected service keys', () => {
    expect(SERVICE_KEYS).toEqual(['vm', 'ha']);
  });

  it('VM preset sets the rr-conflict + suspend-io DRBD properties', () => {
    expect(getServicePreset('vm')).toEqual({
      nameSuggestion: 'vm-data',
      props: [
        { key: 'DrbdOptions/Net/rr-conflict', value: 'retry-connect' },
        { key: 'DrbdOptions/Resource/on-no-data-accessible', value: 'suspend-io' },
        { key: 'DrbdOptions/Resource/on-no-quorum', value: 'suspend-io' },
      ],
    });
  });

  it('HA preset sets quorum + io-error + force-secondary DRBD properties', () => {
    expect(getServicePreset('ha')).toEqual({
      nameSuggestion: 'ha-data',
      props: [
        { key: 'DrbdOptions/Resource/on-no-data-accessible', value: 'io-error' },
        { key: 'DrbdOptions/Resource/auto-promote', value: 'no' },
        { key: 'DrbdOptions/Resource/quorum', value: 'majority' },
        { key: 'DrbdOptions/Resource/on-no-quorum', value: 'io-error' },
        { key: 'DrbdOptions/Resource/on-suspended-primary-outdated', value: 'force-secondary' },
      ],
    });
  });
});
