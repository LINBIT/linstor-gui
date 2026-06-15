# Cluster Setup Wizard — Initialize Step Extensions

Date: 2026-05-20
Branch: `389-it-didn-t-show-real-time-progress-as-drbdsetup-events2-did` (cluster-setup work is tagged onto this branch from stash; will be split into its own branch before MR).

## Goal

When a LINSTOR controller has no nodes registered yet, the Dashboard should guide the user through a focused initial-setup experience rather than showing empty charts. The setup wizard should also be able to seed a sensibly-configured Resource Group via presets covering common deployment targets.

## Non-goals

- Spawning resources from the wizard (deferred).
- Editing existing resource groups via the wizard (use the existing Resource Group page).
- Multi-controller setup or controller install (out of scope).

## Section 1 — Dashboard visibility

`src/app/pages/Dashboard/Dashboard.tsx` currently renders:

```
<PageBasic title=...>
  <SetupClusterCard />        (only when nodes.length === 0, internal check)
  <StoragePoolInfo />          (always)
  <FaultyList />               (always)
</PageBasic>
```

New rule, evaluated in Dashboard:

| nodes.length | dismissed | Rendered children |
|---|---|---|
| `0` | `false` | `SetupClusterCard` only |
| `0` | `true`  | `StoragePoolInfo` + `FaultyList` (the user opted out) |
| `>= 1` | any | `StoragePoolInfo` + `FaultyList` |

Implementation notes:

- Move the node-count query out of `SetupClusterCard` and into `Dashboard.tsx` (or extract a small `useClusterEmpty()` hook). The card itself becomes presentational and is rendered or not by the parent. Reason: we now need the empty-cluster signal at the parent level to decide whether to suppress chart + faulty list.
- A loading skeleton is still required: while the node query is in-flight on first mount, render nothing (matching the existing `if (!isFetched) return null` behavior) so the page doesn't flicker between card and chart.

## Section 2 — Dismiss persistence

- Storage: `localStorage` key `LINSTOR_GUI_CLUSTER_SETUP_DISMISSED` with value `"true"`.
- Lifetime: persists across reloads. The card naturally re-disappears once `nodes.length > 0`, so the dismiss flag is only "load-bearing" in the empty-cluster case.
- Reset path: the user can re-trigger the card by manually clearing localStorage. No UI affordance for "un-dismiss" in this MR — keep scope small.

## Section 3 — SetupClusterCard layout change

Current layout has icon, title/description, and a `Get started` button laid out horizontally with `Space`.

New layout: action buttons move to the **bottom** of the card body, right-aligned. Top area only carries the icon, title, description, and the two bullet points.

```
┌───────────────────────────────────────────────────────────────┐
│  [🚀]   Welcome — let's set up your LINSTOR cluster           │
│         <description paragraph>                                │
│         ○ Register one or more satellite nodes                 │
│         ○ Create storage pools                                 │
│                                                                │
│                              [ Dismiss ]   [ Get started ]    │
└───────────────────────────────────────────────────────────────┘
```

- `Dismiss` is `AntButton` default (ghost-ish), writes the localStorage flag and tells the parent to re-evaluate (via the existing `onCompleted` analog — call it `onDismiss`).
- `Get started` keeps current behavior: opens the wizard modal.
- Buttons sit in a flex row with `justify-end` and a top margin separating them from the bulleted list.

## Section 3b — Storage pools step rework

Original wizard had a per-row `Mode` Radio (`New device` / `Existing`) and free-text `Device path` / `Existing pool name` columns. That has two problems:

1. Mixing new-device and existing rows in the same step is confusing — in practice, a user is doing one or the other across all nodes.
2. The `Device` field is a satellite-side path that the user has to remember and type correctly. LINSTOR already knows which raw block devices are available on each node via `GET /v1/physical-storage/{node}`.

New design:

- A single `Mode` toggle ( `( ) New device  ( ) Existing` ) sits at the top of the step, above the hint. All rows share this mode; switching it flips every row's source field.
- `Mode` is removed as a per-row column.
- The `Source` column is always a `<Select>`:
  - **New device** mode — Select options come from `GET /v1/physical-storage/{row.node}` (each entry's `device` is the option value, formatted with model/size as the label when available). Required field; users cannot continue without picking one.
  - **Existing** mode — `Select mode="tags"`, no fetched options, free-text only. (LINSTOR REST has no endpoint to enumerate already-existing VG / Thin pool / ZFS pool names that have not yet been registered as LINSTOR storage pools.)
- The Select for a row's `Source` re-fetches when the row's `node` changes.

Implementation: extract `DeviceSourceSelect` to its own small component so each row owns its own `useQuery` lifecycle. The wizard owns the top-level `poolMode` state and passes it down.

## Section 4 — Wizard step layout

Existing wizard steps:

```
0. Add nodes
1. Add storage pools
2. Done
```

New steps:

```
0. Add nodes
1. Add storage pools
2. Resource group        (NEW — entire step is optional)
3. Done
```

**The entire Resource group step is optional.** A user who only wants to register nodes + storage pools can skip the step entirely and reach Done without creating any RG.

When the user does want to create an RG, the step gives them a form to do so. Within that form, the preset selector is also optional — it is just a shortcut for pre-filling fields with sensible defaults. The user is free to fill the form manually with no preset.

Footer buttons for the RG step:

```
[ Cancel ]  [ Back ]  [ Skip ]  [ Create resource group ]
```

- `Skip` advances to Done without calling the API.
- `Create resource group` validates the form and submits; on success advances to Done.
- The form's required-field rules only kick in when the user clicks `Create resource group`. Clicking `Skip` never validates.

Pressing `Create resource group` with an empty form (no name) shows a validation error rather than silently skipping — explicit intent is required for either path.

Modal width may need to widen slightly (920 → ~960) to accommodate the new step's two-column form layout; keep `width={960}` and re-evaluate during implementation if it overflows.

## Section 5 — Resource Group step UI

Single antd `Form`. The step's purpose is to create one resource group; the preset selector at the top is an **optional** shortcut for pre-filling the form. The user is free to skip the preset and fill in fields manually.

```
┌─ Preset (optional):  [ – none –  ▾  VM | Proxmox | CloudStack | HA ] ─┐
│   Hint: picking a preset fills the fields below with sensible        │
│   defaults. You can still tweak any field afterwards, or skip the    │
│   preset and fill in everything manually.                            │
├───────────────────────────────────────────────────────────────────────┤
│   Resource group name * [_____________________________]              │
│   Place count           [ 2 ]                                         │
│   Replicas on different [Aux/node ▾]   (multi-select tag input)      │
│   Replicas on same      [          ]   (multi-select tag input)      │
│                                                                       │
│   ── DRBD options ──                                                  │
│   auto-promote                              [ – ▾ ]                   │
│   Net/protocol                              [ – ▾ ]                   │
│   Resource/quorum                           [ – ▾ ]                   │
│   Resource/on-no-quorum                     [ – ▾ ]                   │
│   Resource/on-suspended-primary-outdated    [ – ▾ ]                   │
│   Disk/disk-flushes                         [ – ▾ ]                   │
└───────────────────────────────────────────────────────────────────────┘
```

Field behavior:

- Preset selector: defaults to **none**. Choosing a preset calls `form.setFieldsValue({...preset_defaults})` for every field the preset covers; choosing `– none –` again does NOT clear the form (the user may have manually adjusted values they want to keep). Re-selecting the same preset re-applies its defaults, overwriting user edits.
- Initial state with no preset: only `Resource group name` is required. All other fields are empty / unset.
- `replicas_on_different` and `replicas_on_same`: antd `Select mode="tags"` so the user can type custom node attributes (e.g. `Aux/rack`, `NodeName`) on top of the seeded `Aux/node`.
- Each DRBD option is a `Select` with the most relevant enum values plus an empty (unset) option. Unspecified DRBD options are NOT sent — only the ones with a chosen value get serialized.

API call: `POST /v1/resource-groups` with:

```ts
{
  name: form.values.name,
  select_filter: {
    place_count: form.values.place_count,
    replicas_on_different: form.values.replicas_on_different,
    replicas_on_same: form.values.replicas_on_same,
  },
  props: {
    'DrbdOptions/auto-promote': form.values.auto_promote,
    'DrbdOptions/Net/protocol': form.values.protocol,
    'DrbdOptions/Resource/quorum': form.values.quorum,
    'DrbdOptions/Resource/on-no-quorum': form.values.on_no_quorum,
    'DrbdOptions/Resource/on-suspended-primary-outdated': form.values.on_suspended_primary_outdated,
    'DrbdOptions/Disk/disk-flushes': form.values.disk_flushes,
  } // omit keys whose value is undefined / null
}
```

Reuse `createResourceGroup` from `@app/features/resourceGroup/api` if present; otherwise add a thin wrapper.

## Section 6 — Preset default values

Tentative defaults, to be refined by user during code review. Same name suggestion pattern as the existing pool step (preset name plus `-data` suffix), which the user can override.

| Field | **VM** | **Proxmox** | **CloudStack** | **HA** |
|---|---|---|---|---|
| name suggestion | `vm-data` | `pve-data` | `cs-data` | `ha-data` |
| `place_count` | 2 | 2 | 2 | 3 |
| `replicas_on_different` | `["Aux/node"]` | `["Aux/node"]` | `["Aux/node"]` | `["Aux/node"]` |
| `replicas_on_same` | `[]` | `[]` | `[]` | `[]` |
| `DrbdOptions/auto-promote` | `yes` | `yes` | `yes` | `yes` |
| `DrbdOptions/Net/protocol` | `C` | `C` | `C` | `C` |
| `DrbdOptions/Resource/quorum` | `off` | `majority` | `off` | `majority` |
| `DrbdOptions/Resource/on-no-quorum` | `io-error` | `suspend-io` | `io-error` | `suspend-io` |
| `DrbdOptions/Resource/on-suspended-primary-outdated` | _(unset)_ | `force-secondary` | _(unset)_ | `force-secondary` |
| `DrbdOptions/Disk/disk-flushes` | `yes` | `no` | `yes` | `yes` |

Note: HA presumes the cluster has at least three nodes; if `successfulNodes.length < 3` show an inline warning under the preset selector but do not block submission.

## Section 7 — i18n additions

Add to `clusterSetup` namespace (English + Chinese):

- `step_resource_group`, `rg_hint`, `preset_label`, `preset_placeholder`
- Preset labels: `preset_vm`, `preset_proxmox`, `preset_cloudstack`, `preset_ha`
- Field labels: `rg_name`, `place_count`, `replicas_on_different`, `replicas_on_same`
- `drbd_options_header`
- Per-option labels: `auto_promote`, `net_protocol`, `resource_quorum`, `on_no_quorum`, `on_suspended_primary_outdated`, `disk_flushes`
- Result tags: `rg_created`, `rg_failed`, `rg_skipped`
- Dismiss button: `dismiss`
- HA warning: `ha_needs_three_nodes`
- RG submit button: `create_resource_group` (Cancel / Back / Skip reuse `common:cancel` / `common:back` / `common:skip`)

## Section 8 — File touch list

```
src/app/pages/Dashboard/Dashboard.tsx
  - Hoist node-count query (or new useClusterEmpty hook).
  - Conditionally render either SetupClusterCard or (StoragePoolInfo + FaultyList).

src/app/features/clusterSetup/components/SetupClusterCard.tsx
  - Move buttons to bottom-right.
  - Add Dismiss button + onDismiss prop.
  - Drop the internal getNodes query (parent now owns it).

src/app/features/clusterSetup/components/SetupClusterWizard.tsx
  - Insert RG step between pools and done.
  - Update step indices, step labels, footer button logic.

src/app/features/clusterSetup/components/ResourceGroupStep.tsx           (NEW)
  - Encapsulates form, preset switching, and submit logic.

src/app/features/clusterSetup/presets.ts                                 (NEW)
  - Exports preset objects { name, place_count, ..., props }.

src/app/features/resourceGroup/api.ts
  - Verify createResourceGroup signature matches the wizard's payload shape.
  - If not, add a thin wrapper inside clusterSetup that maps form → payload.

src/translations/english.ts
src/translations/chinese.ts
  - Add clusterSetup keys listed in Section 7.
```

## Testing

- Unit test for `presets.ts`: each preset produces the exact `select_filter` + `props` map declared above.
- Component test for `ResourceGroupStep`: switching presets reflows form values; submit calls the create API with expected payload; skipping advances without API call.
- Smoke test (manual / playwright): empty cluster shows card → dismiss hides it and reveals chart; refresh keeps it dismissed; clearing localStorage brings it back.

## Open questions

- Whether to also offer "ZFS-specific" preset; not in this MR.
- Whether dismissed-card state should be per-controller (cluster-id keyed); deferred.
