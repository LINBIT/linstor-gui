// SPDX-License-Identifier: GPL-3.0
//
// "empty" scenario — start with zero nodes / zero pools so the GUI's cluster
// setup wizard kicks in. The wizard's POSTs register new nodes and pools
// in-memory so the card disappears after Finish, exactly like a real cluster.

import {
  POOL_NAMES,
  STORAGE_POOL_TOTAL_KIB,
  defaultPhysicalDevicesForNode,
  groupPhysicalStorageByCapacity,
  standardControllerConfig,
  standardControllerProperties,
  standardControllerVersion,
  standardSatelliteConfig,
} from '../lib/fixture.js';
import { buildHandlers } from '../lib/handlers.js';
import { fakeUuid } from '../lib/util.js';

// Mutable in-memory state.
const nodes = [];
const storagePools = [];
const resourceGroups = [];
const resourceDefinitions = [];
const resources = [];
/** node_name → array of available raw devices */
const physicalDevicesByNode = {};

let uuidSeed = 1;
const nextUuid = () => fakeUuid(uuidSeed++);

const buildNodeFromRequest = (body) => {
  const name = body?.name ?? 'mock';
  const type = body?.type ?? 'Satellite';
  const netInterfaces = Array.isArray(body?.net_interfaces) && body.net_interfaces.length > 0
    ? body.net_interfaces
    : [
        {
          name: 'default',
          address: '0.0.0.0',
          satellite_port: 3366,
          satellite_encryption_type: 'PLAIN',
          is_active: true,
        },
      ];

  return {
    name,
    type,
    flags: [],
    props: { CurStltConnName: 'default', NodeUname: name },
    net_interfaces: netInterfaces.map((ni) => ({
      name: ni.name ?? 'default',
      address: ni.address ?? '0.0.0.0',
      satellite_port: ni.satellite_port ?? 3366,
      satellite_encryption_type: ni.satellite_encryption_type ?? 'PLAIN',
      is_active: ni.is_active ?? true,
      uuid: nextUuid(),
    })),
    connection_status: 'ONLINE',
    uuid: nextUuid(),
    storage_providers: ['DISKLESS', 'LVM', 'LVM_THIN', 'ZFS', 'FILE'],
    resource_layers: ['DRBD', 'LUKS', 'STORAGE'],
    unsupported_providers: {},
    unsupported_layers: {},
  };
};

const buildStoragePoolFromBody = (nodeName, body) => ({
  storage_pool_name: body?.storage_pool_name ?? body?.name ?? POOL_NAMES[0],
  node_name: nodeName,
  provider_kind: body?.provider_kind ?? 'LVM_THIN',
  props: body?.props ?? {},
  static_traits: { Provisioning: 'THIN', SupportsSnapshots: 'true' },
  free_capacity: STORAGE_POOL_TOTAL_KIB,
  total_capacity: STORAGE_POOL_TOTAL_KIB,
  free_space_mgr_name: `${nodeName}:${body?.storage_pool_name ?? POOL_NAMES[0]}`,
  uuid: nextUuid(),
  reports: [],
  supports_snapshots: true,
  shared_space: null,
});

const ok = () => [{ ret_code: 1, message: 'OK' }];
const err = (msg) => [{ ret_code: -1, message: msg }];

const data = {
  nodes: () => nodes,
  storagePools: () => storagePools,
  resourceGroups: () => resourceGroups,
  resourceDefinitions: () => resourceDefinitions,
  resources: () => resources,
  // Re-group on every read so adds/removes are reflected immediately.
  physicalStorage: () => groupPhysicalStorageByCapacity(physicalDevicesByNode),
  controllerVersion: standardControllerVersion,
  controllerConfig: standardControllerConfig,
  controllerProperties: standardControllerProperties,
  satelliteConfig: standardSatelliteConfig,
};

export default {
  name: 'empty',
  description: 'Empty cluster — exercise the setup wizard',
  ...data,
  handlers: {
    ...buildHandlers(data),

    // ----- Setup wizard mutations -----

    nodeAdd: ({ body }) => {
      if (!body?.name) return err('Missing node name');
      if (nodes.some((n) => n.name === body.name)) {
        return err(`Node "${body.name}" already exists`);
      }
      nodes.push(buildNodeFromRequest(body));
      // Give the new node a few raw devices to play with — this lets the
      // GUI's Storage Pool create form / wizard show realistic choices.
      physicalDevicesByNode[body.name] = defaultPhysicalDevicesForNode(body.name);
      return ok();
    },

    createDevicePool: ({ params, body }) => {
      const nodeName = params.node;
      const node = nodes.find((n) => n.name === nodeName);
      if (!node) return err(`Unknown node "${nodeName}"`);

      // `with_storage_pool.name` is what LINSTOR uses as the resulting
      // storage pool name; fall back to `pool_name` and finally a default.
      const poolName =
        body?.with_storage_pool?.name ?? body?.pool_name ?? `${body?.provider_kind ?? 'LVM_THIN'}-pool`;

      if (storagePools.some((p) => p.node_name === nodeName && p.storage_pool_name === poolName)) {
        return err(`Storage pool "${poolName}" already exists on ${nodeName}`);
      }
      storagePools.push(
        buildStoragePoolFromBody(nodeName, {
          storage_pool_name: poolName,
          provider_kind: body?.provider_kind,
          props: {
            'StorDriver/LvmVg': poolName,
          },
        }),
      );
      // Consume the requested devices from the available list so the GUI
      // shows that they were used.
      const consumed = new Set(body?.device_paths ?? []);
      if (consumed.size > 0 && physicalDevicesByNode[nodeName]) {
        physicalDevicesByNode[nodeName] = physicalDevicesByNode[nodeName].filter(
          (dev) => !consumed.has(dev.device),
        );
      }
      return ok();
    },

    nodeStoragePoolCreate: ({ params, body }) => {
      const nodeName = params.node;
      const node = nodes.find((n) => n.name === nodeName);
      if (!node) return err(`Unknown node "${nodeName}"`);

      const poolName = body?.storage_pool_name;
      if (!poolName) return err('Missing storage_pool_name');
      if (storagePools.some((p) => p.node_name === nodeName && p.storage_pool_name === poolName)) {
        return err(`Storage pool "${poolName}" already exists on ${nodeName}`);
      }
      storagePools.push(buildStoragePoolFromBody(nodeName, body));
      return ok();
    },

    // ----- Light-touch deletes so cleanup also works for demos -----

    nodeDelete: ({ params }) => {
      const idx = nodes.findIndex((n) => n.name === params.node);
      if (idx >= 0) nodes.splice(idx, 1);
      // Cascade: drop pools and raw devices belonging to that node.
      for (let i = storagePools.length - 1; i >= 0; i -= 1) {
        if (storagePools[i].node_name === params.node) storagePools.splice(i, 1);
      }
      delete physicalDevicesByNode[params.node];
      return ok();
    },

    nodeStoragePoolDelete: ({ params }) => {
      const idx = storagePools.findIndex(
        (p) => p.node_name === params.node && p.storage_pool_name === params.storagepool,
      );
      if (idx >= 0) storagePools.splice(idx, 1);
      return ok();
    },
  },
};
