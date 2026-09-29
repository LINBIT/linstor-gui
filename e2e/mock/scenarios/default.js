// SPDX-License-Identifier: GPL-3.0
//
// "default" scenario — a small, healthy 3-node cluster with one resource.
// Useful as a sanity check that the GUI renders normal data.

import {
  buildNodes,
  buildResourceDefinitionAndResources,
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

const NODE_NAMES = ['node01', 'node02', 'node03'];

const NODES = buildNodes({ nodeNames: NODE_NAMES });
const STORAGE_POOLS = buildStoragePools({ nodeNames: NODE_NAMES });
const RESOURCE_GROUPS = buildResourceGroups();

const { resourceDefinition: RD, resources: RESOURCES } = buildResourceDefinitionAndResources({
  name: 'demo',
  port: 7001,
  placements: NODE_NAMES.map((nodeName, i) => ({ nodeName, isPrimary: i === 0 })),
});

const PHYSICAL_STORAGE = groupPhysicalStorageByCapacity(
  Object.fromEntries(NODE_NAMES.map((n) => [n, defaultPhysicalDevicesForNode(n)])),
);

const data = {
  nodes: () => NODES,
  storagePools: () => STORAGE_POOLS,
  resourceGroups: () => RESOURCE_GROUPS,
  resourceDefinitions: () => [RD],
  resources: () => RESOURCES,
  physicalStorage: () => PHYSICAL_STORAGE,
  controllerVersion: standardControllerVersion,
  controllerConfig: standardControllerConfig,
  controllerProperties: standardControllerProperties,
  satelliteConfig: standardSatelliteConfig,
};

export default {
  name: 'default',
  description: '3 nodes, 1 healthy resource',
  ...data,
  handlers: buildHandlers(data),
};
