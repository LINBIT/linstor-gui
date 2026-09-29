# linstor-gui-mock

A spec-driven mock LINSTOR REST API for exercising
linstor-gui without a real cluster.

The router loads `spec/rest_v1_openapi.json` (regenerated from
`linstor-server`'s upstream OpenAPI YAML) at startup and exposes **every**
operation in the spec — currently 129 paths / 176 operations / 164 schemas.

For each request:

1. The path + method is matched against the compiled spec routes.
2. If the active scenario has an override for the operation's `operationId`,
   the override produces the body.
3. Otherwise the router generates a default body from the operation's success
   response schema (using `example` / `default` / `enum` hints).

So scenarios only need to declare the data they care about; everything else
returns plausible JSON shaped exactly like the real controller would.

## Run

The end-to-end tests start it themselves (`npm run e2e`, see
`playwright.config.ts`). To run the GUI against it by hand, from the
repository root:

```sh
MOCK_SCENARIO=default npm run e2e:mock   # 3 healthy nodes, 1 resource (port 3478)
MOCK_SCENARIO=empty npm run e2e:mock     # no nodes: the setup wizard
npm run dev:mock                         # the GUI, proxied to 127.0.0.1:3478
```

Other scenarios: `sync` (5 nodes with live sync progress), `large-scale`
(500 nodes / 1000 resources), `thin-sentinel`. `PORT` and `MOCK_LATENCY_MS`
change the port and add latency.

## Regenerating the spec

`spec/rest_v1_openapi.json` is generated from the same LINSTOR spec the GUI's
typed client comes from (`src/app/apis/Linstor-Linstor-1.30.0.yaml`). After
updating that YAML (and `npm run generate-api:linstor`), regenerate it:

```sh
npm run e2e:mock-spec
# or from another spec file:
node e2e/mock/scripts/generate-spec.mjs /path/to/rest_v1_openapi.yaml
```

## Scenarios

Pick via `MOCK_SCENARIO` env var or `--scenario=<name>`:

| Scenario      | What it shows                                                        |
| ------------- | -------------------------------------------------------------------- |
| `default`     | 3 nodes, 1 healthy resource. Smoke test the GUI looks normal.        |
| `sync`        | Multi-peer SyncSource fan-out. Animated progress per peer.           |
| `empty`       | Zero nodes — exercises the cluster setup wizard. Writes persist in memory. |
| `large-scale` | 500 nodes / 1000 resources for stress / perf testing.                |

## Tunables

All scenarios honour `PORT`, `HOST`, `MOCK_LATENCY_MS`, `MOCK_VERBOSE=0/1`.
Per-scenario knobs:

### `sync`

The scenario loops a full success lifecycle: sync in progress
(`SyncSource` / `SyncTarget` with `done_percentage` climbing 0% → 100%) →
all volumes settle to `UpToDate` for a rest period → next cycle starts.

| Variable                 | Default | Meaning                                                  |
| ------------------------ | ------- | -------------------------------------------------------- |
| `MOCK_SYNC_NODE_COUNT`   | `5`     | Total nodes (1 source + N-1 targets)                     |
| `MOCK_SYNC_WORK_MS`      | `40000` | Duration of the syncing phase (0% → 100%)                |
| `MOCK_SYNC_REST_MS`      | `15000` | Duration of the settled `UpToDate` phase between cycles  |
| `MOCK_SYNC_DURATION_MS`  | —       | Back-compat alias for `MOCK_SYNC_WORK_MS`                |
| `MOCK_SYNC_SOURCE`       | `gui01` | Which node is the SyncSource                             |

### `large-scale`

| Variable                    | Default | Meaning                                    |
| --------------------------- | ------- | ------------------------------------------ |
| `MOCK_NODE_COUNT`           | `500`   | Number of nodes                            |
| `MOCK_RESOURCE_COUNT`       | `1000`  | Rows in `/v1/view/resources`               |
| `MOCK_REPLICA_COUNT`        | `3`     | Placements per resource definition         |
| `MOCK_VOLUMES_PER_RESOURCE` | `1`     | Volume definitions per resource            |

Examples:

```sh
MOCK_NODE_COUNT=2000 MOCK_RESOURCE_COUNT=5000 npm run large-scale
MOCK_SYNC_NODE_COUNT=7 MOCK_SYNC_DURATION_MS=90000 npm run sync
MOCK_LATENCY_MS=200 npm run sync
```

## Architecture

```
linstor-gui-mock/
├── server.js                 # http entry: loads scenario, hands req → handler
├── scripts/
│   └── generate-spec.mjs     # YAML → JSON converter (uses `yaml` devDep)
├── spec/
│   └── rest_v1_openapi.json  # checked-in, regeneratable
├── lib/
│   ├── specRouter.js         # compiles every spec path into a route + dispatcher
│   ├── schemaMock.js         # OpenAPI schema → mock JSON (handles $ref, allOf, enum, format)
│   ├── handlers.js           # `buildHandlers(data)`: standard overrides reusable across scenarios
│   ├── router.js             # thin compatibility wrapper (re-exports createHandler)
│   ├── fixture.js            # builders for nodes / pools / resource defs
│   └── util.js               # uuid, padding helpers
└── scenarios/
    ├── default.js            # data + buildHandlers(...) overrides
    ├── sync.js
    └── large-scale.js
```

A scenario is just an object with:

```js
export default {
  name: 'my-scenario',
  description: 'one-line summary',

  // Optional: data getters used by buildHandlers + by the routerʼs fallbacks
  // (e.g. /v1/space-report). Leave any out you don't care about.
  nodes:               () => [...],
  storagePools:        () => [...],
  resourceGroups:      () => [...],
  resourceDefinitions: () => [...],
  resources:           () => [...],
  controllerVersion:   () => ({ version: 'x', rest_api_version: 'y' }),
  controllerConfig:    () => ({ ... }),
  controllerProperties:() => ({ ... }),
  satelliteConfig:     () => ({ ... }),

  // Per-operationId overrides. Anything not listed falls back to a
  // schema-generated default. Throw `FALLTHROUGH` to opt back into the
  // default for a specific call.
  handlers: {
    nodeList: ({ helpers }) => helpers.paginate(myNodes),
    viewResources: ({ helpers, params, query }) => [...],
    // ...
  },
};
```

`buildHandlers(data)` provides the standard list of overrides for the common
endpoints (stats counts, list/view endpoints, controller version/config,
key-value-store, etc.). Most scenarios just spread it and customize the few
they need.

Then `MOCK_SCENARIO=my-scenario npm run e2e:mock`.
