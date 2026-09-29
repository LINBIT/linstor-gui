// SPDX-License-Identifier: GPL-3.0
//
// "workflows" scenario — the default 3-node cluster, but the objects a user
// creates and deletes are kept: resource groups, resource definitions and
// their resources (plain create, autoplace, spawn), snapshots, controller
// properties and auth tokens. Refusals answer like the controller does: an
// error status with an ApiCallRc list, so the GUI's error paths run too.

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
import { fakeUuid } from '../lib/util.js';

const NODE_NAMES = ['node01', 'node02', 'node03'];
const DEFAULT_SIZE_KIB = 1024 * 1024;

const nodes = buildNodes({ nodeNames: NODE_NAMES });
const storagePools = buildStoragePools({ nodeNames: NODE_NAMES });
const resourceGroups = buildResourceGroups();
const resourceDefinitions = [];
const resources = [];
const snapshots = [];
const controllerProperties = { ...standardControllerProperties() };
const authTokens = [];

let nextPort = 7001;
let uuidSeed = 500000;
const nextUuid = () => fakeUuid(uuidSeed++);

// The ApiCallRc codes the real controller sends (op | object | outcome), so
// the GUI picks the same headline as against a real cluster.
const RC = {
  RG_CREATED: 21233665,
  RG_DELETED: 54788098,
  RD_CREATED: 20447233,
  RD_DELETED: 54001666,
  VD_CREATED: 19922945,
  RSC_PLACED: 20185089,
  RSC_UPDATED: 20185091,
  SNAP_CREATED: 17563649,
  SNAP_STEP: 17563651,
  SNAP_DELETED: 51118082,
  PROPS_SET: 34603011,
  ERROR: -4611686018406153700,
};

const reply = (...entries) => entries.map(([ret_code, message]) => ({ ret_code, message }));

/** Answers like a refusing controller: an error status and an ApiCallRc list. */
const refuse = (res, status, message) => {
  const body = JSON.stringify(reply([RC.ERROR, message]));
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
  return null;
};

const placeCountOf = (groupName) =>
  resourceGroups.find((rg) => rg.name === groupName)?.select_filter?.place_count ?? 2;

/** Places `name` on the first `count` nodes, as a diskful replica each. */
const place = (rd, count) => {
  const sizeKib = rd.volume_definitions?.[0]?.size_kib ?? DEFAULT_SIZE_KIB;
  const { resources: placed } = buildResourceDefinitionAndResources({
    name: rd.name,
    port: rd.layer_data?.[0]?.data?.port ?? nextPort++,
    resourceGroup: rd.resource_group_name,
    volumeSizeKib: sizeKib,
    placements: NODE_NAMES.slice(0, count).map((nodeName, i) => ({ nodeName, isPrimary: i === 0 })),
  });
  resources.push(...placed);
  return placed.map((r) => [RC.RSC_UPDATED, `Resource '${rd.name}' updated on node '${r.node_name}'`]);
};

/** A resource definition with its volume definitions, ready to place. */
const defineResource = ({ name, resourceGroup, sizeKib }) => {
  const { resourceDefinition } = buildResourceDefinitionAndResources({
    name,
    port: nextPort++,
    resourceGroup,
    volumeSizeKib: sizeKib ?? DEFAULT_SIZE_KIB,
    placements: [],
  });
  if (sizeKib === undefined) resourceDefinition.volume_definitions = [];
  resourceDefinitions.push(resourceDefinition);
  return resourceDefinition;
};

const removeWhere = (list, predicate) => {
  for (let i = list.length - 1; i >= 0; i -= 1) if (predicate(list[i])) list.splice(i, 1);
};

const data = {
  nodes: () => nodes,
  storagePools: () => storagePools,
  resourceGroups: () => resourceGroups,
  resourceDefinitions: () => resourceDefinitions,
  resources: () => resources,
  physicalStorage: () =>
    groupPhysicalStorageByCapacity(Object.fromEntries(NODE_NAMES.map((n) => [n, defaultPhysicalDevicesForNode(n)]))),
  controllerVersion: standardControllerVersion,
  controllerConfig: standardControllerConfig,
  controllerProperties: () => controllerProperties,
  satelliteConfig: standardSatelliteConfig,
};

// One resource from the start, so snapshots have something to work on.
const demo = defineResource({ name: 'demo', resourceGroup: 'DfltRscGrp', sizeKib: DEFAULT_SIZE_KIB });
place(demo, 2);

export default {
  name: 'workflows',
  description: 'Default cluster with stateful create/delete of groups, resources, snapshots, tokens',
  ...data,
  handlers: {
    ...buildHandlers(data),

    // ----- resource groups -----
    resourceGroupCreate: ({ body, res }) => {
      const name = body?.name;
      if (resourceGroups.some((rg) => rg.name === name)) {
        return refuse(res, 500, `A resource group with the name '${name}' already exists.`);
      }
      resourceGroups.push({
        name,
        description: body?.description ?? '',
        props: body?.props ?? {},
        select_filter: { place_count: 2, ...body?.select_filter },
        uuid: nextUuid(),
      });
      return reply([RC.RG_CREATED, `New resource group '${name}' created.`]);
    },
    resourceGroupDelete: ({ params, res }) => {
      const name = params.resource_group;
      if (resourceDefinitions.some((rd) => rd.resource_group_name === name)) {
        return refuse(res, 500, `Cannot delete resource group '${name}' because it has existing resource definitions.`);
      }
      removeWhere(resourceGroups, (rg) => rg.name === name);
      return reply([RC.RG_DELETED, `Resource group '${name}' deleted.`]);
    },
    resourceGroupSpawn: ({ params, body, res }) => {
      const name = body?.resource_definition_name;
      if (resourceDefinitions.some((rd) => rd.name === name)) {
        return refuse(res, 500, `A resource definition with the name '${name}' already exists.`);
      }
      const rd = defineResource({
        name,
        resourceGroup: params.resource_group,
        sizeKib: body?.volume_sizes?.[0] ?? DEFAULT_SIZE_KIB,
      });
      const placed = place(rd, body?.select_filter?.place_count ?? placeCountOf(params.resource_group));
      return reply([RC.RD_CREATED, `New resource definition '${name}' created.`], ...placed);
    },

    // ----- resource definitions and placement -----
    resourceDefinitionCreate: ({ body, res }) => {
      const name = body?.resource_definition?.name;
      if (resourceDefinitions.some((rd) => rd.name === name)) {
        return refuse(res, 500, `A resource definition with the name '${name}' already exists.`);
      }
      defineResource({ name, resourceGroup: body?.resource_definition?.resource_group_name ?? 'DfltRscGrp' });
      return reply([RC.RD_CREATED, `New resource definition '${name}' created.`]);
    },
    volumeDefinitionCreate: ({ params, body }) => {
      const rd = resourceDefinitions.find((r) => r.name === params.resource);
      const sizeKib = body?.volume_definition?.size_kib ?? DEFAULT_SIZE_KIB;
      rd?.volume_definitions.push({ volume_number: rd.volume_definitions.length, size_kib: sizeKib, props: {}, flags: [] });
      return reply([RC.VD_CREATED, `New volume definition with number '0' of resource definition '${params.resource}' created.`]);
    },
    resourceAutoplace: ({ params, body }) => {
      const rd = resourceDefinitions.find((r) => r.name === params.resource);
      const placed = place(rd, body?.select_filter?.place_count ?? placeCountOf(rd.resource_group_name));
      return reply([RC.RSC_PLACED, `Resource '${params.resource}' successfully autoplaced on ${placed.length} nodes`], ...placed);
    },
    resourceDefinitionDelete: ({ params, res }) => {
      const name = params.resource;
      if (!resourceDefinitions.some((rd) => rd.name === name)) {
        return refuse(res, 404, `Resource definition '${name}' not found.`);
      }
      removeWhere(resourceDefinitions, (rd) => rd.name === name);
      removeWhere(resources, (r) => r.name === name);
      removeWhere(snapshots, (s) => s.resource_name === name);
      return reply([RC.RD_DELETED, `Resource definition '${name}' deleted.`]);
    },

    // ----- snapshots -----
    viewSnapshots: ({ helpers }) => {
      const rscFilter = helpers.getMulti('resources');
      return helpers.paginate(rscFilter ? snapshots.filter((s) => rscFilter.has(s.resource_name)) : snapshots);
    },
    resourceSnapshotsList: ({ params }) => snapshots.filter((s) => s.resource_name === params.resource),
    resourceSnapshotCreate: ({ params, body, res }) => {
      const resourceName = params.resource;
      const name = body?.name;
      if (snapshots.some((s) => s.resource_name === resourceName && s.name === name)) {
        return refuse(
          res,
          500,
          `A snapshot definition with the name '${name}' already exists in resource definition '${resourceName}'.`,
        );
      }
      const rd = resourceDefinitions.find((r) => r.name === resourceName);
      const onNodes = resources.filter((r) => r.name === resourceName).map((r) => r.node_name);
      snapshots.push({
        name,
        resource_name: resourceName,
        nodes: onNodes,
        props: {},
        flags: ['SUCCESSFUL'],
        uuid: nextUuid(),
        volume_definitions: (rd?.volume_definitions ?? []).map((vd) => ({
          volume_number: vd.volume_number,
          size_kib: vd.size_kib,
        })),
        snapshots: onNodes.map((node) => ({
          snapshot_name: name,
          node_name: node,
          create_timestamp: Date.now(),
          flags: [],
          uuid: nextUuid(),
        })),
      });
      return reply(
        [RC.SNAP_CREATED, `New snapshot '${name}' of resource '${resourceName}' registered.`],
        ...onNodes.map((node) => [RC.SNAP_STEP, `Resumed IO of '[${resourceName}]' on '${node}' after snapshot`]),
      );
    },
    resourceSnapshotDelete: ({ params }) => {
      removeWhere(snapshots, (s) => s.resource_name === params.resource && s.name === params.snapshot);
      return reply([RC.SNAP_DELETED, `Snapshot '${params.snapshot}' of resource '${params.resource}' deleted.`]);
    },

    // ----- controller properties and token auth -----
    controllerPropertyModify: ({ body }) => {
      Object.assign(controllerProperties, body?.override_props);
      for (const key of body?.delete_props ?? []) delete controllerProperties[key];
      return reply([RC.PROPS_SET, 'Successfully set property key(s)']);
    },
    controllerAuthTokenInitialize: () => {
      if (controllerProperties['Auth/TokenAuthenticationEnabled'] === 'true') {
        return reply([1, 'Token authentication is already enabled']);
      }
      controllerProperties['Auth/TokenAuthenticationEnabled'] = 'true';
      const token = 'e2e-init-token';
      authTokens.push({
        id: authTokens.length + 1,
        description: 'linstor-gui',
        created_at: new Date().toISOString(),
        is_active: true,
        is_user_token: true,
      });
      return [{ ret_code: 1, message: `Init token ${token}`, obj_refs: { token } }];
    },
    controllerAuthTokenList: () => ({ count: authTokens.length, list: authTokens }),
    controllerAuthTokenCreate: ({ body }) => {
      const id = authTokens.length ? Math.max(...authTokens.map((t) => t.id)) + 1 : 1;
      authTokens.push({
        id,
        description: body?.description ?? '',
        ip_filter: body?.ip_filter,
        expires_at: body?.expires_at,
        created_at: new Date().toISOString(),
        is_active: true,
        is_user_token: true,
      });
      const token = `e2e-token-${id}`;
      return [{ ret_code: 1, message: `Auth token ${id} created`, obj_refs: { token } }];
    },
    controllerAuthTokenModify: ({ params, body }) => {
      const token = authTokens.find((t) => t.id === Number(params.authtokenid));
      if (token && typeof body?.is_active === 'boolean') token.is_active = body.is_active;
      return reply([1, `Auth token ${params.authtokenid} modified`]);
    },
    controllerAuthTokenRevoke: ({ params }) => {
      removeWhere(authTokens, (t) => t.id === Number(params.authtokenid));
      return reply([1, `Auth token ${params.authtokenid} revoked`]);
    },
  },
};
