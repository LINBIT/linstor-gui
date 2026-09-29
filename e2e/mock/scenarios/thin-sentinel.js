// SPDX-License-Identifier: GPL-3.0
//
// "thin-sentinel" scenario — reproduces gitlab #388.
//
// STORAGE_SPACES_THIN (LINBIT SDS for Windows / WinDRBD) reports a sentinel
// free capacity of 4096 PiB on a tiny backing pool (7.48 GiB total). A GUI that
// naively computes used = total - free and plots free directly draws negative
// "used" bars and a meaningless multi-PiB axis on the Storage Pool Overview.
//
// Run: MOCK_SCENARIO=thin-sentinel PORT=43510 node server.js

import {
  buildNodes,
  groupPhysicalStorageByCapacity,
  defaultPhysicalDevicesForNode,
  standardControllerConfig,
  standardControllerProperties,
  standardControllerVersion,
  standardSatelliteConfig,
} from '../lib/fixture.js';
import { buildHandlers } from '../lib/handlers.js';
import { fakeUuid } from '../lib/util.js';

const NODE_NAMES = ['winstor-0', 'winstor-1', 'winstor-2'];

// Capacities are reported in KiB by the LINSTOR REST API.
const FREE_CAPACITY_KIB = 4096 * 1024 ** 4; // 4096 PiB — the sentinel value
const TOTAL_CAPACITY_KIB = Math.round(7.48 * 1024 * 1024); // 7.48 GiB backing pool

const NODES = buildNodes({ nodeNames: NODE_NAMES });

const STORAGE_POOLS = NODE_NAMES.flatMap((node, i) => [
  {
    storage_pool_name: 'sp0',
    node_name: node,
    provider_kind: 'STORAGE_SPACES_THIN',
    props: { StorDriver: 'STORAGE_SPACES_THIN', 'StorDriver/StorPoolName': 'wss0' },
    static_traits: { Provisioning: 'THIN', SupportsSnapshots: 'false' },
    free_capacity: FREE_CAPACITY_KIB,
    total_capacity: TOTAL_CAPACITY_KIB,
    free_space_mgr_name: `${node}:sp0`,
    uuid: fakeUuid(100 + i),
    reports: [],
    supports_snapshots: false,
    shared_space: null,
  },
  {
    storage_pool_name: 'DfltDisklessStorPool',
    node_name: node,
    provider_kind: 'DISKLESS',
    props: {},
    static_traits: { SupportsSnapshots: 'false' },
    uuid: fakeUuid(200 + i),
    reports: [],
    supports_snapshots: false,
  },
]);

const PHYSICAL_STORAGE = groupPhysicalStorageByCapacity(
  Object.fromEntries(NODE_NAMES.map((n) => [n, defaultPhysicalDevicesForNode(n)])),
);

const data = {
  nodes: () => NODES,
  storagePools: () => STORAGE_POOLS,
  resourceGroups: () => [],
  resourceDefinitions: () => [],
  resources: () => [],
  physicalStorage: () => PHYSICAL_STORAGE,
  controllerVersion: standardControllerVersion,
  controllerConfig: standardControllerConfig,
  controllerProperties: standardControllerProperties,
  satelliteConfig: standardSatelliteConfig,
};

export default {
  name: 'thin-sentinel',
  description: '3 nodes, STORAGE_SPACES_THIN sp0 reporting 4096 PiB free on a 7.48 GiB pool (#388)',
  ...data,
  handlers: buildHandlers(data),
};
