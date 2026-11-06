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
  STORAGE_POOL_TOTAL_KIB,
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
const remotes = { s3_remotes: [], linstor_remotes: [], ebs_remotes: [] };
// Backups by remote name, keyed like the controller's "linstor" map.
const backups = new Map();
// External files by path; content is base64, as the API carries it.
const files = new Map();
// drbd-reactor: the node each HA resource is promoted on.
const promotedOn = new Map();
const REACTOR_DIR = '/etc/drbd-reactor.d/';

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
  VD_MODIFIED: 19922947,
  RSC_PLACED: 20185089,
  RSC_UPDATED: 20185091,
  SNAP_CREATED: 17563649,
  SNAP_STEP: 17563651,
  SNAP_DELETED: 51118082,
  PROPS_SET: 34603011,
  NODE_CREATED: 1,
  NODE_DELETED: 2,
  SP_CREATED: 1,
  SP_DELETED: 2,
  REMOTE_CREATED: 1,
  REMOTE_DELETED: 2,
  BACKUP_STARTED: 1,
  FILE_CREATED: 1,
  FILE_MODIFIED: 3,
  FILE_DELETED: 2,
  RD_MODIFIED: 20447235,
  ERROR: -4611686018406153700,
};

const reply = (...entries) => entries.map(([ret_code, message]) => ({ ret_code, message }));

/** Answers like a refusing controller: an error status and an ApiCallRc list. */
const refuse = (res, status, message) => send(res, status, reply([RC.ERROR, message]));

const send = (res, status, reply) => {
  const body = JSON.stringify(reply);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
  return null;
};

/** A clone reply, success or not: ResourceDefinitionCloneStarted, its ApiCallRc list in `messages`. */
const cloneStarted = (source, name, messages) => ({
  location: `/v1/resource-definitions/${source}/clone/${name}`,
  source_name: source,
  clone_name: name,
  messages,
});

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

/** An empty pool of `kind` on `node`, as a freshly created one looks. */
const addStoragePool = (node, name, kind, props = {}) => {
  storagePools.push({
    storage_pool_name: name,
    node_name: node,
    provider_kind: kind ?? 'LVM',
    props: { StorDriver: kind ?? 'LVM', ...props },
    static_traits: { Provisioning: kind?.endsWith('_THIN') ? 'THIN' : 'FAT', SupportsSnapshots: 'true' },
    free_capacity: STORAGE_POOL_TOTAL_KIB,
    total_capacity: STORAGE_POOL_TOTAL_KIB,
    free_space_mgr_name: `${node}:${name}`,
    uuid: nextUuid(),
    reports: [],
    supports_snapshots: true,
  });
};

const fileName = (params) => decodeURIComponent(params.extFileName);

/** The resources with a drbd-reactor config deployed, and that config's path. */
const haConfigs = () =>
  resourceDefinitions.flatMap((rd) =>
    Object.keys(rd.props ?? {})
      .filter((key) => key.startsWith(`files${REACTOR_DIR}`))
      .map((key) => ({ resource: rd.name, path: key.slice('files'.length) })),
  );

const replicaNodes = (resource) => resources.filter((r) => r.name === resource).map((r) => r.node_name);

const activeNode = (resource) => promotedOn.get(resource) ?? replicaNodes(resource)[0];

// ----- linstor-gateway -----
// Its targets and exports by kind, each with the status a healthy one reports.
const gatewayResources = { iscsi: [], nfs: [], 'nvme-of': [] };
const GATEWAY_ID = { iscsi: 'iqn', nfs: 'name', 'nvme-of': 'nqn' };
const gatewayError = (message) => ({ code: 'Conflict', message });

const gateway = ({ method, path, body }) => {
  if (path === '/api/v2/status') return [200, { status: 'ok', version: '2.3.0' }];
  const [, kind, rawId, action] = path.slice('/api/v2/'.length).match(/^([^/]+)\/?([^/]*)\/?([^/]*)$/) ?? [];
  const list = gatewayResources[kind];
  if (!list) return [404, gatewayError(`unknown path ${path}`)];
  const key = GATEWAY_ID[kind];
  const id = decodeURIComponent(rawId ?? '');
  const found = list.find((r) => r[key] === id);

  if (method === 'GET' && !id) return [200, list];
  if (method === 'GET') return found ? [200, found] : [404, gatewayError(`${id} not found`)];
  if (method === 'POST' && !id) {
    if (list.some((r) => r[key] === body?.[key])) {
      return [409, gatewayError(`resource ${body?.[key]} already exists`)];
    }
    const volumes = body?.volumes ?? [{ number: 1, size_kib: body?.size_kib }];
    const created = {
      ...body,
      status: {
        state: 'OK',
        service: 'Started',
        primary: 'node01',
        nodes: ['node01', 'node02'],
        volumes: volumes.map((v) => ({ number: v.number, state: 'OK' })),
      },
    };
    list.push(created);
    return [201, created];
  }
  if (method === 'POST' && found && (action === 'start' || action === 'stop')) {
    found.status.service = action === 'start' ? 'Started' : 'Stopped';
    return [200, found];
  }
  if (method === 'DELETE' && found && !action) {
    removeWhere(list, (r) => r[key] === id);
    return [200, {}];
  }
  return [404, gatewayError(`${id} not found`)];
};

/** A drbd-reactorctl command that succeeded on every node asked. */
const reactorDone = (body) => (body?.nodes ?? []).map((node) => ({ node, exit_code: 0, stdout_utf8: '' }));

/**
 * drbd-reactorctl status --json as `node` answers it: a promoter for each HA
 * resource with a replica there, active on the node it is promoted on.
 */
const reactorStatus = (node) => ({
  promoter: haConfigs()
    .filter(({ resource }) => replicaNodes(resource).includes(node))
    .map(({ resource, path }) => {
      const active = activeNode(resource) === node;
      return {
        drbd_resource: resource,
        path,
        primary_on: activeNode(resource),
        status: active ? 'active' : 'inactive',
        target: {
          name: `drbd-services@${resource}.target`,
          status: active ? 'active' : 'inactive',
          freezer: 'thawed',
        },
        dependencies: [],
      };
    }),
});

/** Adds a remote of `kind` (s3_remotes, linstor_remotes), refusing a taken name. */
const addRemote = (kind, body, res) => {
  const name = body?.remote_name;
  if (Object.values(remotes).some((list) => list.some((r) => r.remote_name === name))) {
    return refuse(res, 500, `A remote with the name '${name}' already exists.`);
  }
  const { secret_key: _secret, access_key: _access, ...shown } = body ?? {};
  remotes[kind].push({ ...shown });
  return reply([RC.REMOTE_CREATED, `New remote '${name}' created.`]);
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
  gateway,
  handlers: {
    ...buildHandlers(data),

    // ----- nodes and storage pools -----
    nodeAdd: ({ body, res }) => {
      const name = body?.name;
      if (nodes.some((n) => n.name === name)) {
        return refuse(res, 500, `A node with the name '${name}' already exists.`);
      }
      const [node] = buildNodes({ nodeNames: [name] });
      nodes.push({
        ...node,
        type: body?.type ?? 'Satellite',
        net_interfaces: (body?.net_interfaces ?? []).map((nic) => ({ ...nic, uuid: nextUuid() })),
        connection_status: 'OFFLINE',
        uuid: nextUuid(),
      });
      return reply([RC.NODE_CREATED, `New node '${name}' registered.`]);
    },
    nodeDelete: ({ params, res }) => {
      const name = params.node;
      if (resources.some((r) => r.node_name === name)) {
        return refuse(res, 500, `Node '${name}' still has resources.`);
      }
      removeWhere(nodes, (n) => n.name === name);
      removeWhere(storagePools, (p) => p.node_name === name);
      return reply([RC.NODE_DELETED, `Node '${name}' deleted.`]);
    },
    createDevicePool: ({ params, body, res }) => {
      const name = body?.with_storage_pool?.name;
      if (storagePools.some((p) => p.node_name === params.node && p.storage_pool_name === name)) {
        return refuse(res, 500, `A storage pool with the name '${name}' already exists on node '${params.node}'.`);
      }
      addStoragePool(params.node, name, body?.provider_kind);
      return reply([RC.SP_CREATED, `Successfully created storage pool '${name}' on node '${params.node}'.`]);
    },
    nodeStoragePoolCreate: ({ params, body, res }) => {
      const name = body?.storage_pool_name;
      if (storagePools.some((p) => p.node_name === params.node && p.storage_pool_name === name)) {
        return refuse(res, 500, `A storage pool with the name '${name}' already exists on node '${params.node}'.`);
      }
      const backing = body?.props?.['StorDriver/StorPoolName'];
      if (backing !== undefined && !/^[a-zA-Z0-9_/-]+$/.test(backing)) {
        return refuse(res, 500, `Invalid property(StorDriver/StorPoolName) value: ${backing}`);
      }
      addStoragePool(params.node, name, body?.provider_kind, body?.props);
      return reply([RC.SP_CREATED, `New storage pool '${name}' on node '${params.node}' registered.`]);
    },
    nodeStoragePoolDelete: ({ params }) => {
      removeWhere(storagePools, (p) => p.node_name === params.node && p.storage_pool_name === params.storagepool);
      return reply([RC.SP_DELETED, `Storage pool '${params.storagepool}' on node '${params.node}' deleted.`]);
    },

    // ----- remotes and backups -----
    'GET /v1/remotes': () => remotes,
    'POST /v1/remotes/s3': ({ body, res }) => addRemote('s3_remotes', body, res),
    'POST /v1/remotes/linstor': ({ body, res }) => addRemote('linstor_remotes', body, res),
    'DELETE /v1/remotes': ({ query }) => {
      const name = query.get('remote_name');
      for (const list of Object.values(remotes)) removeWhere(list, (r) => r.remote_name === name);
      backups.delete(name);
      return reply([RC.REMOTE_DELETED, `Remote '${name}' deleted.`]);
    },
    'GET /v1/remotes/{remote_name}/backups': ({ params }) => ({
      linstor: Object.fromEntries(backups.get(params.remote_name) ?? []),
      other: {},
    }),
    'POST /v1/remotes/{remote_name}/backups': ({ params, body, res }) => {
      const rd = resourceDefinitions.find((r) => r.name === body?.rsc_name);
      if (!rd) return refuse(res, 404, `Resource definition '${body?.rsc_name}' not found.`);
      const list = backups.get(params.remote_name) ?? new Map();
      backups.set(params.remote_name, list);
      const snap = `back_${String(list.size + 1).padStart(5, '0')}`;
      const id = `${rd.name}_${snap}`;
      list.set(id, {
        id,
        start_time: '2026-01-01T00:00:00Z',
        start_timestamp: 1767225600000,
        finished_time: '2026-01-01T00:01:00Z',
        finished_timestamp: 1767225660000,
        origin_rsc: rd.name,
        origin_snap: snap,
        origin_node: 'node01',
        success: true,
        shipping: false,
        restorable: true,
        vlms: [],
      });
      return reply([RC.BACKUP_STARTED, `Backup shipping of resource '${rd.name}' to remote '${params.remote_name}' started.`]);
    },

    // ----- external files -----
    // The GUI encodes a file's path before openapi-fetch encodes the URL, and
    // the controller URL-decodes the name it receives again (Files.java), so
    // the routed parameter is decoded once more here.
    // The list carries no content; alt_suffixes only where a file has some.
    'GET /v1/files': () => [...files.values()].map(({ path, alt_suffixes }) => ({ path, ...(alt_suffixes && { alt_suffixes }) })),
    'GET /v1/files/{extFileName}': ({ params, res }) =>
      files.get(fileName(params)) ?? refuse(res, 404, `External file '${fileName(params)}' not found.`),
    'PUT /v1/files/{extFileName}': ({ params, body }) => {
      const created = !files.has(fileName(params));
      files.set(fileName(params), {
        path: fileName(params),
        content: body?.content ?? '',
        ...(body?.alt_suffixes?.length && { alt_suffixes: body.alt_suffixes }),
      });
      return reply([
        created ? RC.FILE_CREATED : RC.FILE_MODIFIED,
        `External file '${fileName(params)}' ${created ? 'created' : 'modified'}.`,
      ]);
    },
    'DELETE /v1/files/{extFileName}': ({ params, res }) => {
      if (resourceDefinitions.some((rd) => rd.props?.[`files${fileName(params)}`])) {
        return refuse(res, 500, `External file '${fileName(params)}' is still deployed.`);
      }
      files.delete(fileName(params));
      return reply([RC.FILE_DELETED, `External file '${fileName(params)}' deleted.`]);
    },
    resourceDeploy: ({ params, res }) => {
      const rd = resourceDefinitions.find((r) => r.name === params.resource);
      if (!rd) return refuse(res, 404, `Resource definition '${params.resource}' not found.`);
      if (!files.has(fileName(params))) return refuse(res, 404, `External file '${fileName(params)}' not found.`);
      rd.props = { ...rd.props, [`files${fileName(params)}`]: 'True' };
      return reply([RC.RD_MODIFIED, `Resource definition '${params.resource}' modified.`]);
    },
    resourceUndeploy: ({ params }) => {
      const rd = resourceDefinitions.find((r) => r.name === params.resource);
      if (rd?.props) delete rd.props[`files${fileName(params)}`];
      return reply([RC.RD_MODIFIED, `Resource definition '${params.resource}' modified.`]);
    },

    // ----- drbd-reactor -----
    nodeExecDrbdReactorStatus: ({ body }) =>
      (body?.nodes ?? []).map((node) => ({ node, exit_code: 0, stdout_utf8: JSON.stringify(reactorStatus(node)) })),
    nodeExecDrbdReactorDisable: ({ body }) => reactorDone(body),
    nodeExecDrbdReactorEnable: ({ body }) => reactorDone(body),
    nodeExecDrbdReactorRestart: ({ body }) => reactorDone(body),
    nodeExecDrbdReactorEvict: ({ body }) => {
      const resource = body?.resource;
      const from = activeNode(resource);
      const others = replicaNodes(resource).filter((n) => n !== from);
      if (others.length) promotedOn.set(resource, others[0]);
      return (body?.nodes ?? []).map((node) => ({
        node,
        exit_code: 0,
        stdout_utf8: '',
        ...(body?.wait && node === from ? { active_node: activeNode(resource) } : {}),
      }));
    },

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
        const taken = reply([RC.ERROR, `A resource definition with the name '${name}' already exists`]);
        return send(res, 500, cloneStarted(params.resource, name, taken));
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
    resourceDefinitionClone: ({ params, body, res }) => {
      const source = resourceDefinitions.find((r) => r.name === params.resource);
      const name = body?.name;
      if (resourceDefinitions.some((rd) => rd.name === name)) {
        const taken = reply([RC.ERROR, `A resource definition with the name '${name}' already exists`]);
        return send(res, 500, cloneStarted(params.resource, name, taken));
      }
      const rd = defineResource({
        name,
        resourceGroup: source.resource_group_name,
        sizeKib: source.volume_definitions?.[0]?.size_kib ?? DEFAULT_SIZE_KIB,
      });
      place(rd, resources.filter((r) => r.name === source.name).length);
      return cloneStarted(
        source.name,
        name,
        reply([RC.RD_CREATED, `New resource definition '${name}' cloned from '${source.name}'.`]),
      );
    },
    volumeDefinitionModify: ({ params, body, res }) => {
      const rd = resourceDefinitions.find((r) => r.name === params.resource);
      const vd = rd?.volume_definitions.find((v) => v.volume_number === Number(params.volume_number));
      const sizeKib = body?.size_kib;
      if (vd && sizeKib !== undefined) {
        if (sizeKib < vd.size_kib) {
          return refuse(res, 500, `Shrinking volume definition '${params.volume_number}' of '${params.resource}' is not supported.`);
        }
        vd.size_kib = sizeKib;
        for (const r of resources.filter((x) => x.name === params.resource)) {
          for (const v of r.volumes ?? []) if (v.volume_number === vd.volume_number) v.allocated_size_kib = sizeKib;
        }
      }
      return reply([RC.VD_MODIFIED, `Volume definition with number '${params.volume_number}' on resource definition '${params.resource}' modified.`]);
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
