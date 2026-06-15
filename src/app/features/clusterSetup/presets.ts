// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

// A "service" preset is a named bundle of DRBD resource-group properties that
// pre-fills the property editor in the cluster-setup wizard. The user can then
// add/edit/remove any property before creating the resource group.
export const SERVICE_KEYS = ['vm', 'ha'] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

export type ServiceProp = { key: string; value: string };

export type ServicePreset = {
  /** Suggested resource group name; the user can override it. */
  nameSuggestion: string;
  /** DRBD resource-group properties this service sets, in display order. */
  props: ServiceProp[];
};

const VM: ServicePreset = {
  nameSuggestion: 'vm-data',
  props: [
    { key: 'DrbdOptions/Net/rr-conflict', value: 'retry-connect' },
    { key: 'DrbdOptions/Resource/on-no-data-accessible', value: 'suspend-io' },
    { key: 'DrbdOptions/Resource/on-no-quorum', value: 'suspend-io' },
  ],
};

const HA: ServicePreset = {
  nameSuggestion: 'ha-data',
  props: [
    { key: 'DrbdOptions/Resource/on-no-data-accessible', value: 'io-error' },
    { key: 'DrbdOptions/Resource/auto-promote', value: 'no' },
    { key: 'DrbdOptions/Resource/quorum', value: 'majority' },
    { key: 'DrbdOptions/Resource/on-no-quorum', value: 'io-error' },
    { key: 'DrbdOptions/Resource/on-suspended-primary-outdated', value: 'force-secondary' },
  ],
};

const PRESETS: Record<ServiceKey, ServicePreset> = {
  vm: VM,
  ha: HA,
};

export const getServicePreset = (key: ServiceKey): ServicePreset => PRESETS[key];
