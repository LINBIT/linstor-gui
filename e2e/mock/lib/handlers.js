// SPDX-License-Identifier: GPL-3.0
//
// Reusable handler factory: takes a scenario's data getters and produces a
// `handlers` map keyed by OpenAPI operationId. Scenarios can spread this map
// and then override any individual entries.

// Writes a controller-style ApiCallRc 404 directly; the router sees the
// response is already sent and skips its own.
const notFound = (res, message) => {
  const body = JSON.stringify([{ ret_code: -1, message }]);
  res.writeHead(404, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
  return null;
};

export const buildHandlers = ({
  nodes,
  storagePools,
  resourceGroups,
  resourceDefinitions,
  resources,
  controllerVersion,
  controllerConfig,
  controllerProperties,
  satelliteConfig,
  physicalStorage,
}) => {
  // Instance name -> props. Stateful like the controller: the GUI keeps its
  // settings and users here and reads them back on every load, so a
  // write-and-forget stub makes it re-initialise forever.
  const keyValueStores = new Map();
  const kvInstance = (name) => ({ name, props: { ...keyValueStores.get(name) } });

  return {
    // ---- controller ----
    controllerVersion: () => controllerVersion(),
    ControllerConfig: () => controllerConfig(),
    controllerPropertyList: () => controllerProperties(),
    CtrlSetConfig: () => [{ ret_code: 1, message: 'OK' }],
    controllerPropertyModify: () => [{ ret_code: 1, message: 'OK' }],
    controllerPropertyDelete: () => [{ ret_code: 1, message: 'OK' }],
    controllerBackupDB: () => [{ ret_code: 1, message: 'OK' }],

    // ---- stats ----
    nodeStats: () => ({ count: nodes().length }),
    resourceDefinitionStats: () => ({ count: resourceDefinitions().length }),
    resourceGroupStats: () => ({ count: resourceGroups().length }),
    storagePoolsStats: () => ({ count: storagePools().length }),
    resourcesStats: () => ({ count: resources().length }),
    errorReportStats: () => ({ count: 0 }),

    // ---- nodes ----
    nodeList: ({ helpers }) => {
      let list = nodes();
      const filter = helpers.getMulti('nodes');
      if (filter) list = list.filter((n) => filter.has(n.name));
      return helpers.paginate(list);
    },
    netinterfaceList: ({ params }) => {
      const node = nodes().find((n) => n.name === params.node);
      return node?.net_interfaces ?? [];
    },
    nodeStoragePoolList: ({ params }) => storagePools().filter((p) => p.node_name === params.node),
    SatelliteConfig: () => satelliteConfig(),
    nodeConnectionsList: () => [],

    // ---- storage pool definitions ----
    storagePoolDfnList: () => {
      const seen = new Set();
      return storagePools()
        .filter((p) => {
          if (seen.has(p.storage_pool_name)) return false;
          seen.add(p.storage_pool_name);
          return true;
        })
        .map((p) => ({ storage_pool_name: p.storage_pool_name, props: {} }));
    },

    // ---- view endpoints ----
    viewResources: ({ helpers }) => {
      let list = resources();
      const nodeFilter = helpers.getMulti('nodes');
      if (nodeFilter) list = list.filter((r) => nodeFilter.has(r.node_name));
      const rscFilter = helpers.getMulti('resources');
      if (rscFilter) list = list.filter((r) => rscFilter.has(r.name));
      const spFilter = helpers.getMulti('storage_pools');
      if (spFilter) {
        list = list.filter((r) => r.volumes?.some((v) => spFilter.has(v.storage_pool_name)));
      }
      return helpers.paginate(list);
    },
    viewStoragePools: ({ helpers }) => {
      let list = storagePools();
      const nodeFilter = helpers.getMulti('nodes');
      if (nodeFilter) list = list.filter((p) => nodeFilter.has(p.node_name));
      const spFilter = helpers.getMulti('storage_pools');
      if (spFilter) list = list.filter((p) => spFilter.has(p.storage_pool_name));
      return helpers.paginate(list);
    },
    viewSnapshots: () => [],
    viewSnapshotShippings: () => [],

    // ---- resource definitions ----
    resourceDefinitionList: ({ helpers }) => {
      let list = resourceDefinitions();
      const filter = helpers.getMulti('resource_definitions');
      if (filter) list = list.filter((rd) => filter.has(rd.name));
      return helpers.paginate(list);
    },
    resourceList: ({ params }) => resources().filter((r) => r.name === params.resource),
    volumeDefinitionList: ({ params }) => {
      const rd = resourceDefinitions().find((r) => r.name === params.resource);
      return rd?.volume_definitions ?? [];
    },
    resourceSnapshotsList: () => [],
    resourceConnectionsList: () => [],

    // ---- resource groups ----
    resourceGroupList: ({ helpers }) => helpers.paginate(resourceGroups()),
    volumeGroupList: () => [{ volume_number: 0, props: {}, flags: [], uuid: '00000000-0000-0000-0000-000000000000' }],

    // ---- physical storage ----
    viewPhysicaStorage: ({ helpers }) => {
      const all = physicalStorage?.() ?? [];
      return helpers.paginate(all);
    },
    getPhysicalStorage: ({ params }) => {
      const all = physicalStorage?.() ?? [];
      // Flatten the grouped shape into a per-node device list.
      const out = [];
      for (const group of all) {
        const list = group.nodes?.[params.node] ?? [];
        for (const dev of list) {
          out.push({
            size: group.size,
            rotational: group.rotational,
            device: dev.device,
            model: dev.model,
            serial: dev.serial,
            wwn: dev.wwn,
          });
        }
      }
      return out;
    },

    // ---- key-value store ----
    keyValueStoresList: () => [...keyValueStores.keys()].map(kvInstance),
    keyValueStoreList: ({ params, res }) =>
      keyValueStores.has(params.instance)
        ? [kvInstance(params.instance)]
        : notFound(res, `Could not find key value store instance '${params.instance}'.`),
    // Like the controller, a modify creates the instance when it is missing.
    keyValueStoreModify: ({ params, body }) => {
      const props = keyValueStores.get(params.instance) ?? {};
      Object.assign(props, body?.override_props);
      for (const key of body?.delete_props ?? []) delete props[key];
      for (const ns of body?.delete_namespaces ?? []) {
        for (const key of Object.keys(props)) if (key.startsWith(`${ns}/`)) delete props[key];
      }
      keyValueStores.set(params.instance, props);
      return [{ ret_code: 1, message: `Key value store '${params.instance}' modified.` }];
    },
    keyValueStoreDelete: ({ params, res }) =>
      keyValueStores.delete(params.instance)
        ? [{ ret_code: 1, message: `Key value store '${params.instance}' deleted.` }]
        : notFound(res, `Could not find key value store instance '${params.instance}'.`),

    // ---- error reports ----
    errorReportList: () => [],

    // ---- remotes / files / schedules ----
    // (These are listed in the spec under various operationIds; falling through
    //  to the schema-driven default returns shapes the GUI accepts.)
  };
};
