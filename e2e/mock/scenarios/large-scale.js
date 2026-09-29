// SPDX-License-Identifier: GPL-3.0
//
// "large-scale" scenario — 500 nodes / 1000 resources by default. Tunable via
// MOCK_NODE_COUNT / MOCK_RESOURCE_COUNT / MOCK_REPLICA_COUNT env vars.

import {
  buildNodes,
  buildResourceGroups,
  buildStoragePools,
  defaultPhysicalDevicesForNode,
  groupPhysicalStorageByCapacity,
  padNodeName,
  POOL_NAMES,
  standardControllerConfig,
  standardControllerProperties,
  standardControllerVersion,
  standardSatelliteConfig,
} from '../lib/fixture.js';
import { buildHandlers } from '../lib/handlers.js';
import { fakeUuid } from '../lib/util.js';

const NODE_COUNT = Number(process.env.MOCK_NODE_COUNT || 500);
const RESOURCE_COUNT = Number(process.env.MOCK_RESOURCE_COUNT || 1000);
const REPLICA_COUNT = Number(process.env.MOCK_REPLICA_COUNT || 3);
const VOLUMES_PER_RESOURCE = Number(process.env.MOCK_VOLUMES_PER_RESOURCE || 1);
const VOLUME_SIZE_KIB = 10 * 1024 * 1024;

const NODE_NAMES = Array.from({ length: NODE_COUNT }, (_, i) => padNodeName(i + 1));

const NODES = buildNodes({ nodeNames: NODE_NAMES });
const STORAGE_POOLS = buildStoragePools({ nodeNames: NODE_NAMES });
const RESOURCE_GROUPS = buildResourceGroups({ replicaCount: REPLICA_COUNT });

const buildAll = () => {
  const definitionCount = Math.ceil(RESOURCE_COUNT / REPLICA_COUNT);
  const resourceDefinitions = [];
  const resources = [];
  let cursor = 0;

  for (let r = 1; r <= definitionCount; r += 1) {
    const name = `rsc${String(r).padStart(5, '0')}`;
    const port = 7000 + r;
    const volumeDefinitions = [];

    for (let v = 0; v < VOLUMES_PER_RESOURCE; v += 1) {
      volumeDefinitions.push({
        volume_number: v,
        size_kib: VOLUME_SIZE_KIB,
        props: {},
        flags: [],
        layer_data: [
          {
            type: 'DRBD',
            data: { resource_name_suffix: '', minor_number: 1000 + r * VOLUMES_PER_RESOURCE + v },
          },
          { type: 'STORAGE', data: {} },
        ],
        uuid: fakeUuid(r * 1000 + v),
      });
    }

    resourceDefinitions.push({
      name,
      external_name: null,
      props: { DrbdPrimarySetOn: NODE_NAMES[(r - 1) % NODE_NAMES.length] },
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
      uuid: fakeUuid(r + 100000),
      resource_group_name: 'DfltRscGrp',
      volume_definitions: volumeDefinitions,
    });

    for (let p = 0; p < REPLICA_COUNT && cursor < RESOURCE_COUNT; p += 1) {
      const nodeIdx = (r - 1 + p * 7) % NODE_NAMES.length;
      const nodeName = NODE_NAMES[nodeIdx];
      const isPrimary = p === 0;

      const volumes = [];
      for (let v = 0; v < VOLUMES_PER_RESOURCE; v += 1) {
        volumes.push({
          volume_number: v,
          storage_pool_name: POOL_NAMES[0],
          provider_kind: 'LVM_THIN',
          device_path: `/dev/drbd${1000 + r * VOLUMES_PER_RESOURCE + v}`,
          allocated_size_kib: VOLUME_SIZE_KIB,
          usable_size_kib: VOLUME_SIZE_KIB,
          props: {},
          flags: [],
          state: { disk_state: 'UpToDate' },
          layer_data_list: [
            {
              type: 'DRBD',
              data: {
                drbd_volume_definition: {
                  volume_number: v,
                  minor_number: 1000 + r * VOLUMES_PER_RESOURCE + v,
                },
                device_path: `/dev/drbd${1000 + r * VOLUMES_PER_RESOURCE + v}`,
                backing_device: `/dev/${POOL_NAMES[0]}/${name}_0000`,
                allocated_size_kib: VOLUME_SIZE_KIB,
                usable_size_kib: VOLUME_SIZE_KIB,
                disk_state: 'UpToDate',
              },
            },
            {
              type: 'STORAGE',
              data: {
                volume_number: v,
                device_path: `/dev/${POOL_NAMES[0]}/${name}_0000`,
                allocated_size_kib: VOLUME_SIZE_KIB,
                usable_size_kib: VOLUME_SIZE_KIB,
                disk_state: 'UpToDate',
              },
            },
          ],
          uuid: fakeUuid(r * 10000 + nodeIdx * 100 + v),
          reports: [],
        });
      }

      resources.push({
        name,
        node_name: nodeName,
        props: { StorPoolName: POOL_NAMES[0] },
        effective_props: {},
        flags: isPrimary ? ['DRBD_PRIMARY_SET_ON'] : [],
        layer_object: {
          children: [
            {
              children: [],
              resource_name_suffix: '',
              type: 'STORAGE',
              storage: { storage_volumes: [] },
            },
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
            node_id: p,
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
        state: { in_use: isPrimary },
        uuid: fakeUuid(r * 1000 + nodeIdx),
        create_timestamp: 1700000000000 + cursor * 1000,
        volumes,
        shared_name: '',
      });
      cursor += 1;
    }
  }

  return { resourceDefinitions, resources };
};

const { resourceDefinitions: RESOURCE_DEFINITIONS, resources: RESOURCES } = buildAll();

// Sample of physical storage for the first 20 nodes only — keeps the response
// snappy at 500-node scale while still demoing what real devices look like.
const PHYSICAL_STORAGE = groupPhysicalStorageByCapacity(
  Object.fromEntries(NODE_NAMES.slice(0, 20).map((n) => [n, defaultPhysicalDevicesForNode(n)])),
);

const data = {
  nodes: () => NODES,
  storagePools: () => STORAGE_POOLS,
  resourceGroups: () => RESOURCE_GROUPS,
  resourceDefinitions: () => RESOURCE_DEFINITIONS,
  resources: () => RESOURCES,
  physicalStorage: () => PHYSICAL_STORAGE,
  controllerVersion: standardControllerVersion,
  controllerConfig: standardControllerConfig,
  controllerProperties: standardControllerProperties,
  satelliteConfig: standardSatelliteConfig,
};

export default {
  name: 'large-scale',
  description: `${NODE_COUNT} nodes, ${RESOURCE_COUNT} resources (${REPLICA_COUNT}-replica)`,
  ...data,
  handlers: buildHandlers(data),
};
