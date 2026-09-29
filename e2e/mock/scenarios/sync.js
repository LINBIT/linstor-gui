// SPDX-License-Identifier: GPL-3.0
//
// "sync" scenario — one resource fanned out across 5 nodes with gui01 as the
// SyncSource for everyone else. Each peer's done_percentage advances with
// wall-clock time so the GUI shows the indicator animating.

import {
  buildNodes,
  buildResourceGroups,
  buildStoragePools,
  defaultPhysicalDevicesForNode,
  groupPhysicalStorageByCapacity,
  standardControllerConfig,
  standardControllerProperties,
  standardControllerVersion,
  standardSatelliteConfig,
} from '../lib/fixture.js';
import { buildHandlers } from '../lib/handlers.js';
import { fakeUuid } from '../lib/util.js';

const NODE_COUNT = Number(process.env.MOCK_SYNC_NODE_COUNT || 5);
const SOURCE_NODE = process.env.MOCK_SYNC_SOURCE || 'gui01';

// Each peer takes `WORK_MS` to climb 0% → 100%, but their start times are
// staggered by `STAGGER_MS` so they finish one after another. The cycle then
// rests for `REST_MS` with everyone UpToDate before looping back to 0.
const WORK_MS = Number(
  process.env.MOCK_SYNC_WORK_MS || process.env.MOCK_SYNC_DURATION_MS || 18_000,
);
const STAGGER_MS = Number(process.env.MOCK_SYNC_STAGGER_MS || 4_000);
const REST_MS = Number(process.env.MOCK_SYNC_REST_MS || 8_000);

const NODE_NAMES = Array.from({ length: NODE_COUNT }, (_, i) => `gui${String(i + 1).padStart(2, '0')}`);
const TARGET_NODES = NODE_NAMES.filter((n) => n !== SOURCE_NODE);
const TARGET_INDEX = Object.fromEntries(TARGET_NODES.map((n, i) => [n, i]));

const STORAGE_POOL = 'ha_sp';
const RESOURCE_NAME = 'ha_fs2';
const RESOURCE_GROUP_NAME = 'ha_grp';
const VOLUME_SIZE_KIB = 10 * 1024 * 1024;

const startedAt = Date.now();
const LAST_PEER_FINISH = (TARGET_NODES.length - 1) * STAGGER_MS + WORK_MS;
const CYCLE_MS = LAST_PEER_FINISH + REST_MS;

/**
 * Per-peer progress: each peer starts syncing at `index * STAGGER_MS` into
 * the cycle and takes `WORK_MS` to reach 100%. Once finished it stays at 100
 * (i.e. UpToDate) until the cycle resets.
 *
 * @returns {number} 0..100
 */
const peerPercent = (peerIndex) => {
  const elapsed = (Date.now() - startedAt) % CYCLE_MS;
  const startAt = peerIndex * STAGGER_MS;
  if (elapsed < startAt) return 0;
  const ratio = (elapsed - startAt) / WORK_MS;
  return Math.max(0, Math.min(100, ratio * 100));
};

const peerIsDone = (peerIndex) => peerPercent(peerIndex) >= 100;

const NODES = buildNodes({ nodeNames: NODE_NAMES }).map((n) => ({ ...n, type: 'Satellite' }));
NODES[NODE_NAMES.indexOf(SOURCE_NODE)].type = 'Combined';

const STORAGE_POOLS = NODE_NAMES.flatMap((nodeName, i) => [
  {
    storage_pool_name: STORAGE_POOL,
    node_name: nodeName,
    provider_kind: 'LVM_THIN',
    props: { StorDriver: 'LVM_THIN' },
    static_traits: { Provisioning: 'THIN', SupportsSnapshots: 'true' },
    free_capacity: 800 * 1024 * 1024,
    total_capacity: 2 * 1024 * 1024 * 1024,
    free_space_mgr_name: `${nodeName}:${STORAGE_POOL}`,
    uuid: fakeUuid(200 + i),
    reports: [],
    supports_snapshots: true,
    shared_space: null,
  },
  {
    storage_pool_name: 'DfltDisklessStorPool',
    node_name: nodeName,
    provider_kind: 'DISKLESS',
    props: {},
    static_traits: { SupportsSnapshots: 'false' },
    uuid: fakeUuid(300 + i),
    reports: [],
    supports_snapshots: false,
  },
]);

const RESOURCE_GROUPS = buildResourceGroups().map((g) => ({ ...g, name: RESOURCE_GROUP_NAME }));

const RESOURCE_DEFINITION = {
  name: RESOURCE_NAME,
  external_name: null,
  props: { DrbdPrimarySetOn: SOURCE_NODE },
  flags: [],
  layer_data: [
    {
      type: 'DRBD',
      data: {
        resource_name_suffix: '',
        peer_slots: 7,
        al_stripes: 1,
        al_stripe_size_kib: 32,
        port: 7001,
        transport_type: 'IP',
        secret: 'mock-secret',
        down: false,
      },
    },
    { type: 'STORAGE', data: {} },
  ],
  uuid: fakeUuid(1000),
  resource_group_name: RESOURCE_GROUP_NAME,
  volume_definitions: [
    {
      volume_number: 0,
      size_kib: VOLUME_SIZE_KIB,
      props: {},
      flags: [],
      uuid: fakeUuid(1001),
    },
  ],
};

const buildVolumeForNode = (nodeName) => {
  let diskState = 'UpToDate';
  let replicationStates = {};

  if (nodeName === SOURCE_NODE) {
    // Source: list each peer that is still catching up. Peers that have
    // already hit 100% are dropped from the map, so the GUI's overlay only
    // shows arrows for in-flight syncs.
    const inflight = TARGET_NODES.filter((peer) => !peerIsDone(TARGET_INDEX[peer]));
    if (inflight.length > 0) {
      diskState = 'SyncSource';
      replicationStates = Object.fromEntries(
        inflight.map((peer) => [
          peer,
          {
            replication_state: 'SyncSource',
            done_percentage: peerPercent(TARGET_INDEX[peer]),
          },
        ]),
      );
    }
  } else {
    // Target: each peer finishes independently. While behind, it's a
    // SyncTarget with its own progress; once at 100% it's UpToDate with no
    // replication_states entry.
    const idx = TARGET_INDEX[nodeName];
    if (!peerIsDone(idx)) {
      diskState = 'SyncTarget';
      replicationStates = {
        [SOURCE_NODE]: {
          replication_state: 'SyncTarget',
          done_percentage: peerPercent(idx),
        },
      };
    }
  }

  return {
    volume_number: 0,
    storage_pool_name: STORAGE_POOL,
    provider_kind: 'LVM_THIN',
    device_path: '/dev/drbd1008',
    allocated_size_kib: 9.46 * 1024 * 1024,
    usable_size_kib: 9.46 * 1024 * 1024,
    props: {},
    flags: [],
    state: { disk_state: diskState, replication_states: replicationStates },
    layer_data_list: [
      {
        type: 'DRBD',
        data: {
          drbd_volume_definition: { volume_number: 0, minor_number: 1008 },
          device_path: '/dev/drbd1008',
          backing_device: `/dev/${STORAGE_POOL}/${RESOURCE_NAME}_0000`,
          allocated_size_kib: 9.46 * 1024 * 1024,
          usable_size_kib: 9.46 * 1024 * 1024,
          disk_state: diskState,
        },
      },
      { type: 'STORAGE', data: {} },
    ],
    uuid: fakeUuid(3000 + nodeName.charCodeAt(nodeName.length - 1)),
    reports: [],
  };
};

const buildResources = () =>
  NODE_NAMES.map((nodeName, i) => ({
    name: RESOURCE_NAME,
    node_name: nodeName,
    props: { StorPoolName: STORAGE_POOL },
    effective_props: {},
    flags: [],
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
          port: 7001,
          transport_type: 'IP',
          secret: 'mock-secret',
          down: false,
        },
        node_id: i,
        peer_slots: 7,
        al_stripes: 1,
        al_size: 32,
        flags: [],
        drbd_volumes: [],
        connections: {},
        promotion_score: nodeName === SOURCE_NODE ? 10103 : 10101,
        may_promote: true,
      },
    },
    state: { in_use: nodeName === SOURCE_NODE },
    uuid: fakeUuid(4000 + i),
    create_timestamp: Date.now() - 60_000,
    volumes: [buildVolumeForNode(nodeName)],
    shared_name: '',
  }));

const PHYSICAL_STORAGE = groupPhysicalStorageByCapacity(
  Object.fromEntries(NODE_NAMES.map((n) => [n, defaultPhysicalDevicesForNode(n)])),
);

const data = {
  nodes: () => NODES,
  storagePools: () => STORAGE_POOLS,
  resourceGroups: () => RESOURCE_GROUPS,
  resourceDefinitions: () => [RESOURCE_DEFINITION],
  // Resources are rebuilt on every request because the sync percentages are
  // wall-clock-based.
  resources: () => buildResources(),
  physicalStorage: () => PHYSICAL_STORAGE,
  controllerVersion: standardControllerVersion,
  controllerConfig: standardControllerConfig,
  controllerProperties: standardControllerProperties,
  satelliteConfig: standardSatelliteConfig,
};

export default {
  name: 'sync',
  description: `${NODE_COUNT}-node fan-out sync from ${SOURCE_NODE} → ${TARGET_NODES.join(', ')}`,
  ...data,
  handlers: buildHandlers(data),
};
