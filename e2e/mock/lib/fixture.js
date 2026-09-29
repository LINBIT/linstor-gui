// SPDX-License-Identifier: GPL-3.0
//
// Builders that turn a small spec (node names, resource counts, etc.) into
// the full LINSTOR-shaped objects the router serves.

import { fakeUuid, pad } from './util.js';

export const STORAGE_POOL_TOTAL_KIB = 2 * 1024 * 1024 * 1024; // 2 TiB
export const POOL_NAMES = ['lvm-thin-pool', 'lvm-pool', 'zfs-pool'];
export const STORAGE_POOL_KINDS = ['LVM_THIN', 'LVM', 'ZFS'];

export const buildNodes = ({ nodeNames }) =>
  nodeNames.map((name, i) => ({
    name,
    type: i === 0 ? 'Combined' : 'Satellite',
    flags: [],
    props: { CurStltConnName: 'default', NodeUname: name },
    net_interfaces: [
      {
        name: 'default',
        address: `10.${(i >> 16) & 0xff}.${(i >> 8) & 0xff}.${i & 0xff}`,
        satellite_port: 3366,
        satellite_encryption_type: 'PLAIN',
        is_active: true,
        uuid: fakeUuid(i * 31 + 1),
      },
    ],
    connection_status: 'ONLINE',
    uuid: fakeUuid(i + 1),
    storage_providers: ['DISKLESS', 'LVM', 'LVM_THIN', 'ZFS', 'FILE'],
    resource_layers: ['DRBD', 'LUKS', 'STORAGE', 'NVME', 'WRITECACHE', 'CACHE', 'BCACHE'],
    unsupported_providers: {},
    unsupported_layers: {},
  }));

export const buildStoragePools = ({ nodeNames, storagePoolsPerNode = 2 }) => {
  const pools = [];
  let seed = 0;
  for (const node of nodeNames) {
    for (let p = 0; p < storagePoolsPerNode; p += 1) {
      seed += 1;
      const idx = p % POOL_NAMES.length;
      pools.push({
        storage_pool_name: POOL_NAMES[idx],
        node_name: node,
        provider_kind: STORAGE_POOL_KINDS[idx % STORAGE_POOL_KINDS.length],
        props: { StorDriver: STORAGE_POOL_KINDS[idx % STORAGE_POOL_KINDS.length] },
        static_traits: { Provisioning: idx === 0 ? 'THIN' : 'FAT', SupportsSnapshots: 'true' },
        free_capacity:
          STORAGE_POOL_TOTAL_KIB - ((seed * 1024 * 1024) % (STORAGE_POOL_TOTAL_KIB / 2)),
        total_capacity: STORAGE_POOL_TOTAL_KIB,
        free_space_mgr_name: `${node}:${POOL_NAMES[idx]}`,
        uuid: fakeUuid(seed * 7 + 17),
        reports: [],
        supports_snapshots: true,
        shared_space: null,
      });
    }
    pools.push({
      storage_pool_name: 'DfltDisklessStorPool',
      node_name: node,
      provider_kind: 'DISKLESS',
      props: {},
      static_traits: { SupportsSnapshots: 'false' },
      uuid: fakeUuid(seed * 11 + 5),
      reports: [],
      supports_snapshots: false,
    });
  }
  return pools;
};

export const buildResourceGroups = ({ replicaCount = 3 } = {}) => [
  {
    name: 'DfltRscGrp',
    description: 'Default resource group',
    props: {},
    select_filter: {
      place_count: replicaCount,
      storage_pool_list: [POOL_NAMES[0]],
      layer_stack: ['DRBD', 'STORAGE'],
    },
    uuid: fakeUuid(1),
    peer_slots: 7,
  },
];

export const buildResourceDefinitionAndResources = ({
  name,
  port,
  resourceGroup = 'DfltRscGrp',
  volumeSizeKib = 10 * 1024 * 1024,
  placements,
  storagePool = POOL_NAMES[0],
}) => {
  const volumeDefinitions = [
    {
      volume_number: 0,
      size_kib: volumeSizeKib,
      props: {},
      flags: [],
      layer_data: [
        { type: 'DRBD', data: { resource_name_suffix: '', minor_number: 1000 + port } },
        { type: 'STORAGE', data: {} },
      ],
      uuid: fakeUuid(port * 1000),
    },
  ];

  const resourceDefinition = {
    name,
    external_name: null,
    props: {
      DrbdPrimarySetOn: placements[0]?.nodeName ?? '',
    },
    flags: [],
    layer_data: [
      {
        type: 'DRBD',
        data: {
          resource_name_suffix: '',
          peer_slots: 7,
          al_stripes: 1,
          al_stripe_size_kib: 32,
          port,
          transport_type: 'IP',
          secret: 'mock-secret',
          down: false,
        },
      },
      { type: 'STORAGE', data: {} },
    ],
    uuid: fakeUuid(port + 100000),
    resource_group_name: resourceGroup,
    volume_definitions: volumeDefinitions,
  };

  const resources = placements.map(({ nodeName, isPrimary, volumeOverride }, idx) => {
    const baseVolume = {
      volume_number: 0,
      storage_pool_name: storagePool,
      provider_kind: 'LVM_THIN',
      device_path: `/dev/drbd${1000 + port}`,
      allocated_size_kib: volumeSizeKib,
      usable_size_kib: volumeSizeKib,
      props: {},
      flags: [],
      state: { disk_state: 'UpToDate', replication_states: {} },
      layer_data_list: [
        {
          type: 'DRBD',
          data: {
            drbd_volume_definition: { volume_number: 0, minor_number: 1000 + port },
            device_path: `/dev/drbd${1000 + port}`,
            backing_device: `/dev/${storagePool}/${name}_0000`,
            allocated_size_kib: volumeSizeKib,
            usable_size_kib: volumeSizeKib,
            disk_state: 'UpToDate',
          },
        },
        {
          type: 'STORAGE',
          data: {
            volume_number: 0,
            device_path: `/dev/${storagePool}/${name}_0000`,
            allocated_size_kib: volumeSizeKib,
            usable_size_kib: volumeSizeKib,
            disk_state: 'UpToDate',
          },
        },
      ],
      uuid: fakeUuid(port * 10000 + idx * 100),
      reports: [],
    };

    const volume = volumeOverride ? volumeOverride(baseVolume) : baseVolume;

    return {
      name,
      node_name: nodeName,
      props: { StorPoolName: storagePool },
      effective_props: {},
      flags: isPrimary ? ['DRBD_PRIMARY_SET_ON'] : [],
      layer_object: {
        children: [
          { children: [], resource_name_suffix: '', type: 'STORAGE', storage: { storage_volumes: [] } },
        ],
        resource_name_suffix: '',
        type: 'DRBD',
        drbd: {
          drbd_resource_definition: {
            resource_name_suffix: '',
            peer_slots: 7,
            al_stripes: 1,
            al_stripe_size_kib: 32,
            port,
            transport_type: 'IP',
            secret: 'mock-secret',
            down: false,
          },
          node_id: idx,
          peer_slots: 7,
          al_stripes: 1,
          al_size: 32,
          flags: [],
          drbd_volumes: [],
          connections: {},
          promotion_score: isPrimary ? 10103 : 10101,
          may_promote: true,
        },
      },
      state: { in_use: Boolean(isPrimary) },
      uuid: fakeUuid(port * 1000 + idx),
      create_timestamp: 1700000000000 + idx * 1000,
      volumes: [volume],
      shared_name: '',
    };
  });

  return { resourceDefinition, resources };
};

export const padNodeName = (i, width = 4) => `node${pad(i, width)}`;

export const standardControllerVersion = () => ({
  version: '1.31.0-mock',
  git_hash: 'mock0000000000000000000000000000mock',
  build_time: '2026-01-01T00:00:00Z',
  rest_api_version: '1.30.0',
});

export const standardControllerConfig = () => ({
  config: { dir: '/etc/linstor' },
  debug: {},
  log: { level: 'INFO' },
  db: { connection_url: 'mock://localhost' },
  http: { listen_addr: '0.0.0.0', port: 3370 },
  https: { listen_addr: '0.0.0.0', port: 3371 },
  ldap: {},
});

export const standardSatelliteConfig = () => ({
  config: { dir: '/etc/linstor' },
  debug: {},
  log: { level: 'INFO' },
  net: { bind_address: '0.0.0.0', port: 3366, com_type: 'PLAIN' },
});

/**
 * Build a default set of "raw" physical storage devices for a node — three
 * unused block devices plus one rotational disk. Use as a starter pack so the
 * setup wizard / Storage Pool create form has realistic choices.
 */
export const defaultPhysicalDevicesForNode = (nodeName) => [
  { device: '/dev/sdb', size: 100 * 1024 * 1024 * 1024, rotational: false, model: 'MockSSD', serial: `${nodeName}-b` },
  { device: '/dev/sdc', size: 100 * 1024 * 1024 * 1024, rotational: false, model: 'MockSSD', serial: `${nodeName}-c` },
  { device: '/dev/sdd', size: 500 * 1024 * 1024 * 1024, rotational: true, model: 'MockHDD', serial: `${nodeName}-d` },
];

/**
 * Group a flat per-node device list into the `PhysicalStorage` shape that
 * `viewPhysicaStorage` returns ({ size, rotational, nodes: { node: [devices] }}).
 */
export const groupPhysicalStorageByCapacity = (devicesByNode) => {
  const groups = new Map();
  for (const [nodeName, devices] of Object.entries(devicesByNode)) {
    for (const dev of devices) {
      const key = `${dev.size}|${dev.rotational}`;
      let group = groups.get(key);
      if (!group) {
        group = { size: dev.size, rotational: dev.rotational, nodes: {} };
        groups.set(key, group);
      }
      const list = group.nodes[nodeName] ?? (group.nodes[nodeName] = []);
      list.push({ device: dev.device, model: dev.model, serial: dev.serial, wwn: dev.wwn });
    }
  }
  return Array.from(groups.values());
};

export const standardControllerProperties = () => ({
  'Auth/TokenAuthenticationEnabled': 'false',
  'Cluster/LocalID': 'mock-cluster-00000000-0000-0000-0000-000000000000',
  'DrbdOptions/AutoEvictAfterTime': '60',
  'DrbdOptions/AutoEvictAllowEviction': 'true',
  'DrbdOptions/AutoEvictMaxDisconnectedNodes': '2',
  'DrbdOptions/AutoEvictMinNodes': '5',
  'DrbdOptions/auto-add-quorum-tiebreaker': 'true',
  'DrbdOptions/auto-diskful': '60',
  'DrbdOptions/auto-diskful-allow-cleanup': 'true',
  'DrbdOptions/auto-quorum': 'io-error',
  'DrbdOptions/auto-resync-after-disable': 'false',
  'DrbdOptions/Net/protocol': 'C',
  'Aux/mock': 'true',
});
