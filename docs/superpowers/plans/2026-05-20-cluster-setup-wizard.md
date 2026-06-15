# Cluster Setup Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing cluster setup wizard so the Dashboard guides empty clusters through node + storage pool + (optional) resource group creation, with dismiss support and preset-driven RG defaults.

**Architecture:** Hoist the "is cluster empty?" signal into a small reusable hook so the Dashboard can hide chart/faulty-list while the SetupClusterCard is shown. Add a `Dismiss` button alongside `Get started` at the bottom of the card (localStorage-persisted). Insert a new optional `ResourceGroupStep` into the wizard's `Steps`, driven by a pure `presets.ts` module that maps preset choice → form defaults; submission posts to `/v1/resource-groups`.

**Tech Stack:** React 18, antd 5, react-i18next, react-query v4, vitest, @testing-library/react.

**Reference spec:** `docs/superpowers/specs/2026-05-20-cluster-setup-wizard-design.md`

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/app/features/clusterSetup/hooks/useClusterEmpty.ts` | NEW | React-query backed hook returning `{ empty, dismissed, dismiss, isFetched }` |
| `src/app/features/clusterSetup/dismiss.ts` | NEW | `localStorage` helpers (`getDismissed` / `setDismissed`) for the `LINSTOR_GUI_CLUSTER_SETUP_DISMISSED` key |
| `src/app/features/clusterSetup/presets.ts` | NEW | Pure module exporting `PRESET_KEYS`, `PresetKey` type, and `getPresetDefaults(key)` |
| `src/app/features/clusterSetup/components/SetupClusterCard.tsx` | MODIFY | Becomes presentational: props `onStart`, `onDismiss`. Bottom-aligned action row |
| `src/app/features/clusterSetup/components/SetupClusterWizard.tsx` | MODIFY | Add step `2 = resource group`, shift Done to step `3`; new footer for RG step |
| `src/app/features/clusterSetup/components/ResourceGroupStep.tsx` | NEW | Form with optional preset selector + RG fields. Self-contained step UI |
| `src/app/features/clusterSetup/index.ts` | MODIFY | Re-export `useClusterEmpty` for the Dashboard |
| `src/app/pages/Dashboard/Dashboard.tsx` | MODIFY | Use `useClusterEmpty` and conditionally render card vs chart/faulty |
| `src/translations/english.ts` | MODIFY | Add new keys under `clusterSetup` namespace |
| `src/translations/chinese.ts` | MODIFY | Add new keys under `clusterSetup` namespace |
| `src/app/features/clusterSetup/__test__/presets.test.ts` | NEW | Unit tests for presets |
| `src/app/features/clusterSetup/__test__/dismiss.test.ts` | NEW | Unit tests for localStorage helpers |
| `src/app/features/clusterSetup/__test__/ResourceGroupStep.test.tsx` | NEW | Component test: preset switching, submit payload, skip path |
| `src/app/features/clusterSetup/__test__/SetupClusterCard.test.tsx` | NEW | Component test: bottom buttons, dismiss flow |
| `src/app/pages/Dashboard/__test__/Dashboard.test.tsx` | NEW | Component test: empty cluster vs populated cluster rendering |

---

## Task 1: presets module

**Files:**
- Create: `src/app/features/clusterSetup/presets.ts`
- Test: `src/app/features/clusterSetup/__test__/presets.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/app/features/clusterSetup/__test__/presets.test.ts
import { describe, expect, it } from 'vitest';

import { PRESET_KEYS, getPresetDefaults } from '../presets';

describe('clusterSetup presets', () => {
  it('exposes the four expected preset keys', () => {
    expect(PRESET_KEYS).toEqual(['vm', 'proxmox', 'cloudstack', 'ha']);
  });

  it('VM preset uses safe general-purpose defaults', () => {
    expect(getPresetDefaults('vm')).toEqual({
      name: 'vm-data',
      place_count: 2,
      replicas_on_different: ['Aux/node'],
      replicas_on_same: [],
      auto_promote: 'yes',
      net_protocol: 'C',
      resource_quorum: 'off',
      on_no_quorum: 'io-error',
      on_suspended_primary_outdated: undefined,
      disk_flushes: 'yes',
    });
  });

  it('Proxmox preset enables quorum and disables disk-flushes', () => {
    expect(getPresetDefaults('proxmox')).toEqual({
      name: 'pve-data',
      place_count: 2,
      replicas_on_different: ['Aux/node'],
      replicas_on_same: [],
      auto_promote: 'yes',
      net_protocol: 'C',
      resource_quorum: 'majority',
      on_no_quorum: 'suspend-io',
      on_suspended_primary_outdated: 'force-secondary',
      disk_flushes: 'no',
    });
  });

  it('CloudStack preset matches the VM baseline with cs-data naming', () => {
    expect(getPresetDefaults('cloudstack')).toEqual({
      name: 'cs-data',
      place_count: 2,
      replicas_on_different: ['Aux/node'],
      replicas_on_same: [],
      auto_promote: 'yes',
      net_protocol: 'C',
      resource_quorum: 'off',
      on_no_quorum: 'io-error',
      on_suspended_primary_outdated: undefined,
      disk_flushes: 'yes',
    });
  });

  it('HA preset turns on majority quorum and suspends IO on quorum loss', () => {
    expect(getPresetDefaults('ha')).toEqual({
      name: 'ha-data',
      place_count: 3,
      replicas_on_different: ['Aux/node'],
      replicas_on_same: [],
      auto_promote: 'yes',
      net_protocol: 'C',
      resource_quorum: 'majority',
      on_no_quorum: 'suspend-io',
      on_suspended_primary_outdated: 'force-secondary',
      disk_flushes: 'yes',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/features/clusterSetup/__test__/presets.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/app/features/clusterSetup/presets.ts
// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

export const PRESET_KEYS = ['vm', 'proxmox', 'cloudstack', 'ha'] as const;
export type PresetKey = (typeof PRESET_KEYS)[number];

export type PresetDefaults = {
  name: string;
  place_count: number;
  replicas_on_different: string[];
  replicas_on_same: string[];
  auto_promote: 'yes' | 'no' | undefined;
  net_protocol: 'A' | 'B' | 'C' | undefined;
  resource_quorum: 'off' | 'majority' | 'all' | undefined;
  on_no_quorum: 'io-error' | 'suspend-io' | undefined;
  on_suspended_primary_outdated: 'force-secondary' | undefined;
  disk_flushes: 'yes' | 'no' | undefined;
};

const VM: PresetDefaults = {
  name: 'vm-data',
  place_count: 2,
  replicas_on_different: ['Aux/node'],
  replicas_on_same: [],
  auto_promote: 'yes',
  net_protocol: 'C',
  resource_quorum: 'off',
  on_no_quorum: 'io-error',
  on_suspended_primary_outdated: undefined,
  disk_flushes: 'yes',
};

const PROXMOX: PresetDefaults = {
  name: 'pve-data',
  place_count: 2,
  replicas_on_different: ['Aux/node'],
  replicas_on_same: [],
  auto_promote: 'yes',
  net_protocol: 'C',
  resource_quorum: 'majority',
  on_no_quorum: 'suspend-io',
  on_suspended_primary_outdated: 'force-secondary',
  disk_flushes: 'no',
};

const CLOUDSTACK: PresetDefaults = {
  ...VM,
  name: 'cs-data',
};

const HA: PresetDefaults = {
  name: 'ha-data',
  place_count: 3,
  replicas_on_different: ['Aux/node'],
  replicas_on_same: [],
  auto_promote: 'yes',
  net_protocol: 'C',
  resource_quorum: 'majority',
  on_no_quorum: 'suspend-io',
  on_suspended_primary_outdated: 'force-secondary',
  disk_flushes: 'yes',
};

const PRESETS: Record<PresetKey, PresetDefaults> = {
  vm: VM,
  proxmox: PROXMOX,
  cloudstack: CLOUDSTACK,
  ha: HA,
};

export const getPresetDefaults = (key: PresetKey): PresetDefaults => PRESETS[key];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/features/clusterSetup/__test__/presets.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/clusterSetup/presets.ts \
        src/app/features/clusterSetup/__test__/presets.test.ts
git commit -m "feat(clusterSetup): add resource group presets module"
```

---

## Task 2: dismiss helpers

**Files:**
- Create: `src/app/features/clusterSetup/dismiss.ts`
- Test: `src/app/features/clusterSetup/__test__/dismiss.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/app/features/clusterSetup/__test__/dismiss.test.ts
import { beforeEach, describe, expect, it } from 'vitest';

import { CLUSTER_SETUP_DISMISSED_KEY, getDismissed, setDismissed } from '../dismiss';

describe('clusterSetup dismiss helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('exports the storage key', () => {
    expect(CLUSTER_SETUP_DISMISSED_KEY).toBe('LINSTOR_GUI_CLUSTER_SETUP_DISMISSED');
  });

  it('returns false when nothing has been stored', () => {
    expect(getDismissed()).toBe(false);
  });

  it('returns true after setDismissed(true)', () => {
    setDismissed(true);
    expect(window.localStorage.getItem(CLUSTER_SETUP_DISMISSED_KEY)).toBe('true');
    expect(getDismissed()).toBe(true);
  });

  it('clears the flag when setDismissed(false) is called', () => {
    setDismissed(true);
    setDismissed(false);
    expect(window.localStorage.getItem(CLUSTER_SETUP_DISMISSED_KEY)).toBeNull();
    expect(getDismissed()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/features/clusterSetup/__test__/dismiss.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/app/features/clusterSetup/dismiss.ts
// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

export const CLUSTER_SETUP_DISMISSED_KEY = 'LINSTOR_GUI_CLUSTER_SETUP_DISMISSED';

export const getDismissed = (): boolean => {
  try {
    return window.localStorage.getItem(CLUSTER_SETUP_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setDismissed = (dismissed: boolean): void => {
  try {
    if (dismissed) {
      window.localStorage.setItem(CLUSTER_SETUP_DISMISSED_KEY, 'true');
    } else {
      window.localStorage.removeItem(CLUSTER_SETUP_DISMISSED_KEY);
    }
  } catch {
    // localStorage may be unavailable (private mode) — silently ignore.
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/features/clusterSetup/__test__/dismiss.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/clusterSetup/dismiss.ts \
        src/app/features/clusterSetup/__test__/dismiss.test.ts
git commit -m "feat(clusterSetup): persist setup-card dismiss flag in localStorage"
```

---

## Task 3: useClusterEmpty hook

**Files:**
- Create: `src/app/features/clusterSetup/hooks/useClusterEmpty.ts`
- Test: `src/app/features/clusterSetup/__test__/useClusterEmpty.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/features/clusterSetup/__test__/useClusterEmpty.test.tsx
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';

import { useClusterEmpty } from '../hooks/useClusterEmpty';
import { CLUSTER_SETUP_DISMISSED_KEY } from '../dismiss';

const mockGetNodes = vi.fn();
vi.mock('@app/features/node/api', () => ({
  getNodes: (...args: unknown[]) => mockGetNodes(...args),
}));

const Probe: React.FC = () => {
  const { empty, dismissed, isFetched } = useClusterEmpty();
  return (
    <div>
      <span data-testid="fetched">{String(isFetched)}</span>
      <span data-testid="empty">{String(empty)}</span>
      <span data-testid="dismissed">{String(dismissed)}</span>
    </div>
  );
};

const renderWithClient = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
};

describe('useClusterEmpty', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockGetNodes.mockReset();
  });

  it('reports empty=true when controller has no nodes and not dismissed', async () => {
    mockGetNodes.mockResolvedValueOnce({ data: [] });
    renderWithClient();
    await waitFor(() => expect(screen.getByTestId('fetched').textContent).toBe('true'));
    expect(screen.getByTestId('empty').textContent).toBe('true');
    expect(screen.getByTestId('dismissed').textContent).toBe('false');
  });

  it('reports empty=false when controller has at least one node', async () => {
    mockGetNodes.mockResolvedValueOnce({ data: [{ name: 'gui01' }] });
    renderWithClient();
    await waitFor(() => expect(screen.getByTestId('fetched').textContent).toBe('true'));
    expect(screen.getByTestId('empty').textContent).toBe('false');
  });

  it('reports dismissed=true when the localStorage flag is set', async () => {
    window.localStorage.setItem(CLUSTER_SETUP_DISMISSED_KEY, 'true');
    mockGetNodes.mockResolvedValueOnce({ data: [] });
    renderWithClient();
    await waitFor(() => expect(screen.getByTestId('fetched').textContent).toBe('true'));
    expect(screen.getByTestId('empty').textContent).toBe('true');
    expect(screen.getByTestId('dismissed').textContent).toBe('true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/features/clusterSetup/__test__/useClusterEmpty.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/app/features/clusterSetup/hooks/useClusterEmpty.ts
// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getNodes } from '@app/features/node/api';

import { CLUSTER_SETUP_DISMISSED_KEY, getDismissed, setDismissed } from '../dismiss';

export type UseClusterEmptyResult = {
  empty: boolean;
  dismissed: boolean;
  isFetched: boolean;
  dismiss: () => void;
  refetch: () => void;
};

export const useClusterEmpty = (): UseClusterEmptyResult => {
  const [dismissed, setDismissedState] = useState<boolean>(() => getDismissed());

  const { data, isFetched, refetch } = useQuery({
    queryKey: ['cluster-setup-node-check'],
    queryFn: () => getNodes({}),
  });

  // Mirror cross-tab localStorage changes (Dismiss in one tab should hide the
  // card in another tab once we re-evaluate).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CLUSTER_SETUP_DISMISSED_KEY) {
        setDismissedState(getDismissed());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setDismissedState(true);
  }, []);

  const nodeCount = (data?.data ?? []).length;
  const empty = nodeCount === 0;

  return {
    empty,
    dismissed,
    isFetched,
    dismiss,
    refetch: () => {
      void refetch();
    },
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/features/clusterSetup/__test__/useClusterEmpty.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/clusterSetup/hooks/useClusterEmpty.ts \
        src/app/features/clusterSetup/__test__/useClusterEmpty.test.tsx
git commit -m "feat(clusterSetup): expose useClusterEmpty hook for dashboard wiring"
```

---

## Task 4: i18n keys

**Files:**
- Modify: `src/translations/english.ts`
- Modify: `src/translations/chinese.ts`

- [ ] **Step 1: Locate the existing clusterSetup section**

Run: `grep -n "clusterSetup:" src/translations/english.ts | head -3`
Expected output: line numbers showing the existing `clusterSetup` namespace start (added by the stash). The keys to add come BEFORE the closing brace of that section.

- [ ] **Step 2: Add the new English keys**

Inside the `clusterSetup` object in `src/translations/english.ts`, add (alphabetical position is fine; here they're grouped semantically):

```ts
    dismiss: 'Dismiss',
    step_resource_group: 'Resource group',
    rg_hint:
      'Optional. Create one resource group now, or skip to finish. Picking a preset pre-fills sensible defaults for common workloads — you can still tweak each field.',
    preset_label: 'Preset',
    preset_placeholder: '— none —',
    preset_vm: 'VM (general)',
    preset_proxmox: 'Proxmox VE',
    preset_cloudstack: 'CloudStack',
    preset_ha: 'High availability',
    rg_name: 'Resource group name',
    place_count: 'Place count',
    replicas_on_different: 'Replicas on different',
    replicas_on_same: 'Replicas on same',
    drbd_options_header: 'DRBD options',
    auto_promote: 'auto-promote',
    net_protocol: 'Net/protocol',
    resource_quorum: 'Resource/quorum',
    on_no_quorum: 'Resource/on-no-quorum',
    on_suspended_primary_outdated: 'Resource/on-suspended-primary-outdated',
    disk_flushes: 'Disk/disk-flushes',
    create_resource_group: 'Create resource group',
    rg_created: 'Resource group {{name}} created.',
    rg_failed: 'Failed to create resource group: {{error}}',
    rg_skipped: 'Resource group step skipped.',
    ha_needs_three_nodes: 'The HA preset assumes at least three nodes for quorum. The current cluster has {{count}}.',
```

- [ ] **Step 3: Add the matching Chinese keys**

In `src/translations/chinese.ts`, add the same keys with Chinese values:

```ts
    dismiss: '忽略',
    step_resource_group: '资源组',
    rg_hint:
      '可选。可以现在创建一个资源组，也可以跳过。选择 preset 会按常见场景预填字段，预填后你仍然可以单独调整。',
    preset_label: '预设',
    preset_placeholder: '— 不选 —',
    preset_vm: 'VM（通用虚拟化）',
    preset_proxmox: 'Proxmox VE',
    preset_cloudstack: 'CloudStack',
    preset_ha: '高可用',
    rg_name: '资源组名称',
    place_count: '副本数',
    replicas_on_different: '不同位置',
    replicas_on_same: '相同位置',
    drbd_options_header: 'DRBD 选项',
    auto_promote: 'auto-promote',
    net_protocol: 'Net/protocol',
    resource_quorum: 'Resource/quorum',
    on_no_quorum: 'Resource/on-no-quorum',
    on_suspended_primary_outdated: 'Resource/on-suspended-primary-outdated',
    disk_flushes: 'Disk/disk-flushes',
    create_resource_group: '创建资源组',
    rg_created: '已创建资源组 {{name}}。',
    rg_failed: '创建资源组失败：{{error}}',
    rg_skipped: '已跳过资源组步骤。',
    ha_needs_three_nodes: 'HA 预设假定至少三个节点。当前集群只有 {{count}} 个节点。',
```

- [ ] **Step 4: Verify translations load**

Run: `npx vitest run src/app/features/clusterSetup/__test__/presets.test.ts`
Expected: PASS — sanity check that no translation file syntax broke the build.

- [ ] **Step 5: Commit**

```bash
git add src/translations/english.ts src/translations/chinese.ts
git commit -m "i18n(clusterSetup): add resource group step + dismiss keys"
```

---

## Task 5: ResourceGroupStep component

**Files:**
- Create: `src/app/features/clusterSetup/components/ResourceGroupStep.tsx`
- Test: `src/app/features/clusterSetup/__test__/ResourceGroupStep.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/features/clusterSetup/__test__/ResourceGroupStep.test.tsx
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ResourceGroupStep, type ResourceGroupStepHandle } from '../components/ResourceGroupStep';

const mockCreate = vi.fn();
vi.mock('@app/features/resourceGroup', () => ({
  createResourceGroup: (...args: unknown[]) => mockCreate(...args),
}));

describe('ResourceGroupStep', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('starts with all DRBD options blank and only Name required', () => {
    render(<ResourceGroupStep nodeCount={3} />);
    // Name input present, no preset chosen yet.
    expect(screen.getByLabelText(/Resource group name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preset/i)).toBeInTheDocument();
  });

  it('applies preset defaults when a preset is chosen', async () => {
    render(<ResourceGroupStep nodeCount={3} />);
    fireEvent.mouseDown(screen.getByLabelText(/Preset/i));
    fireEvent.click(await screen.findByText(/High availability/i));

    await waitFor(() => {
      expect((screen.getByLabelText(/Resource group name/i) as HTMLInputElement).value).toBe('ha-data');
    });
  });

  it('skip() resolves without calling the API', async () => {
    const ref = React.createRef<ResourceGroupStepHandle>();
    render(<ResourceGroupStep ref={ref} nodeCount={3} />);
    const result = await ref.current!.skip();
    expect(result).toEqual({ outcome: 'skipped' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('submit() sends select_filter + DrbdOptions/* props built from form values', async () => {
    mockCreate.mockResolvedValueOnce({ data: [{ ret_code: 1, message: 'OK' }] });

    const ref = React.createRef<ResourceGroupStepHandle>();
    render(<ResourceGroupStep ref={ref} nodeCount={3} />);

    fireEvent.mouseDown(screen.getByLabelText(/Preset/i));
    fireEvent.click(await screen.findByText(/^VM \(general\)$/));

    const result = await ref.current!.submit();
    expect(result).toEqual({ outcome: 'created', name: 'vm-data' });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const body = mockCreate.mock.calls[0][0];
    expect(body.name).toBe('vm-data');
    expect(body.select_filter).toEqual({
      place_count: 2,
      replicas_on_different: ['Aux/node'],
      replicas_on_same: [],
    });
    expect(body.props).toEqual({
      'DrbdOptions/auto-promote': 'yes',
      'DrbdOptions/Net/protocol': 'C',
      'DrbdOptions/Resource/quorum': 'off',
      'DrbdOptions/Resource/on-no-quorum': 'io-error',
      'DrbdOptions/Disk/disk-flushes': 'yes',
    });
  });

  it('shows the HA-needs-three-nodes warning when nodeCount<3 and ha preset is chosen', async () => {
    render(<ResourceGroupStep nodeCount={2} />);
    fireEvent.mouseDown(screen.getByLabelText(/Preset/i));
    fireEvent.click(await screen.findByText(/High availability/i));
    expect(await screen.findByText(/HA preset assumes at least three nodes/i)).toBeInTheDocument();
  });

  it('submit() rejects with validation error if name is missing', async () => {
    const ref = React.createRef<ResourceGroupStepHandle>();
    render(<ResourceGroupStep ref={ref} nodeCount={3} />);
    await expect(ref.current!.submit()).rejects.toThrow();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/features/clusterSetup/__test__/ResourceGroupStep.test.tsx`
Expected: FAIL — component not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/app/features/clusterSetup/components/ResourceGroupStep.tsx
// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Alert, Form, Input, InputNumber, Select, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

import { createResourceGroup } from '@app/features/resourceGroup';

import { PRESET_KEYS, PresetKey, getPresetDefaults } from '../presets';

type FormValues = {
  preset?: PresetKey;
  name?: string;
  place_count?: number;
  replicas_on_different?: string[];
  replicas_on_same?: string[];
  auto_promote?: string;
  net_protocol?: string;
  resource_quorum?: string;
  on_no_quorum?: string;
  on_suspended_primary_outdated?: string;
  disk_flushes?: string;
};

export type ResourceGroupStepHandle = {
  submit: () => Promise<{ outcome: 'created'; name: string }>;
  skip: () => Promise<{ outcome: 'skipped' }>;
};

export interface ResourceGroupStepProps {
  nodeCount: number;
}

const PROP_KEYS: Array<[keyof FormValues, string]> = [
  ['auto_promote', 'DrbdOptions/auto-promote'],
  ['net_protocol', 'DrbdOptions/Net/protocol'],
  ['resource_quorum', 'DrbdOptions/Resource/quorum'],
  ['on_no_quorum', 'DrbdOptions/Resource/on-no-quorum'],
  ['on_suspended_primary_outdated', 'DrbdOptions/Resource/on-suspended-primary-outdated'],
  ['disk_flushes', 'DrbdOptions/Disk/disk-flushes'],
];

const buildPayload = (values: FormValues) => {
  const props: Record<string, string> = {};
  for (const [formKey, propKey] of PROP_KEYS) {
    const value = values[formKey];
    if (typeof value === 'string' && value.length > 0) {
      props[propKey] = value;
    }
  }
  const select_filter: Record<string, unknown> = {};
  if (typeof values.place_count === 'number') select_filter.place_count = values.place_count;
  if (values.replicas_on_different) select_filter.replicas_on_different = values.replicas_on_different;
  if (values.replicas_on_same) select_filter.replicas_on_same = values.replicas_on_same;
  return {
    name: (values.name ?? '').trim(),
    select_filter,
    props,
  };
};

export const ResourceGroupStep = forwardRef<ResourceGroupStepHandle, ResourceGroupStepProps>(
  ({ nodeCount }, ref) => {
    const { t } = useTranslation(['clusterSetup', 'common']);
    const [form] = Form.useForm<FormValues>();
    const [preset, setPreset] = useState<PresetKey | undefined>(undefined);

    const applyPreset = (key: PresetKey) => {
      const defaults = getPresetDefaults(key);
      form.setFieldsValue({
        preset: key,
        name: defaults.name,
        place_count: defaults.place_count,
        replicas_on_different: defaults.replicas_on_different,
        replicas_on_same: defaults.replicas_on_same,
        auto_promote: defaults.auto_promote,
        net_protocol: defaults.net_protocol,
        resource_quorum: defaults.resource_quorum,
        on_no_quorum: defaults.on_no_quorum,
        on_suspended_primary_outdated: defaults.on_suspended_primary_outdated,
        disk_flushes: defaults.disk_flushes,
      });
      setPreset(key);
    };

    useImperativeHandle(
      ref,
      () => ({
        skip: async () => ({ outcome: 'skipped' as const }),
        submit: async () => {
          const values = await form.validateFields();
          const payload = buildPayload(values);
          await createResourceGroup(payload as never);
          return { outcome: 'created' as const, name: payload.name };
        },
      }),
      [form],
    );

    return (
      <Form form={form} layout="vertical">
        <Alert type="info" showIcon message={t('clusterSetup:rg_hint')} style={{ marginBottom: 16 }} />

        <Form.Item name="preset" label={t('clusterSetup:preset_label')}>
          <Select
            allowClear
            placeholder={t('clusterSetup:preset_placeholder')}
            options={PRESET_KEYS.map((k) => ({ value: k, label: t(`clusterSetup:preset_${k}`) }))}
            onChange={(value) => {
              if (value) applyPreset(value as PresetKey);
              else setPreset(undefined);
            }}
          />
        </Form.Item>

        {preset === 'ha' && nodeCount < 3 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={t('clusterSetup:ha_needs_three_nodes', { count: nodeCount })}
          />
        )}

        <Form.Item
          name="name"
          label={t('clusterSetup:rg_name')}
          rules={[{ required: true, message: t('clusterSetup:required') }]}
        >
          <Input placeholder="vm-data" />
        </Form.Item>

        <Space size={16} style={{ display: 'flex', width: '100%' }} wrap>
          <Form.Item name="place_count" label={t('clusterSetup:place_count')} style={{ minWidth: 140 }}>
            <InputNumber min={1} max={32} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="replicas_on_different"
            label={t('clusterSetup:replicas_on_different')}
            style={{ minWidth: 220, flex: 1 }}
          >
            <Select mode="tags" placeholder="Aux/node" />
          </Form.Item>
          <Form.Item
            name="replicas_on_same"
            label={t('clusterSetup:replicas_on_same')}
            style={{ minWidth: 220, flex: 1 }}
          >
            <Select mode="tags" />
          </Form.Item>
        </Space>

        <Typography.Text strong style={{ display: 'block', margin: '12px 0' }}>
          {t('clusterSetup:drbd_options_header')}
        </Typography.Text>

        <Space size={16} style={{ display: 'flex', width: '100%' }} wrap>
          <Form.Item name="auto_promote" label={t('clusterSetup:auto_promote')} style={{ minWidth: 160 }}>
            <Select allowClear options={[{ value: 'yes' }, { value: 'no' }]} />
          </Form.Item>
          <Form.Item name="net_protocol" label={t('clusterSetup:net_protocol')} style={{ minWidth: 160 }}>
            <Select allowClear options={[{ value: 'A' }, { value: 'B' }, { value: 'C' }]} />
          </Form.Item>
          <Form.Item name="resource_quorum" label={t('clusterSetup:resource_quorum')} style={{ minWidth: 160 }}>
            <Select allowClear options={[{ value: 'off' }, { value: 'majority' }, { value: 'all' }]} />
          </Form.Item>
          <Form.Item name="on_no_quorum" label={t('clusterSetup:on_no_quorum')} style={{ minWidth: 180 }}>
            <Select allowClear options={[{ value: 'io-error' }, { value: 'suspend-io' }]} />
          </Form.Item>
          <Form.Item
            name="on_suspended_primary_outdated"
            label={t('clusterSetup:on_suspended_primary_outdated')}
            style={{ minWidth: 220 }}
          >
            <Select allowClear options={[{ value: 'force-secondary' }]} />
          </Form.Item>
          <Form.Item name="disk_flushes" label={t('clusterSetup:disk_flushes')} style={{ minWidth: 160 }}>
            <Select allowClear options={[{ value: 'yes' }, { value: 'no' }]} />
          </Form.Item>
        </Space>
      </Form>
    );
  },
);
ResourceGroupStep.displayName = 'ResourceGroupStep';
```

- [ ] **Step 4: Add createResourceGroup re-export**

Open `src/app/features/resourceGroup/index.ts` and verify `createResourceGroup` is exported. If not present:

```ts
// at the bottom of src/app/features/resourceGroup/index.ts
export { createResourceGroup } from './api';
```

Run: `grep -n "createResourceGroup" src/app/features/resourceGroup/index.ts`
Expected: at least one line referencing the export.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/app/features/clusterSetup/__test__/ResourceGroupStep.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/features/clusterSetup/components/ResourceGroupStep.tsx \
        src/app/features/clusterSetup/__test__/ResourceGroupStep.test.tsx \
        src/app/features/resourceGroup/index.ts
git commit -m "feat(clusterSetup): add optional resource group step with presets"
```

---

## Task 6: Wire ResourceGroupStep into the wizard

**Files:**
- Modify: `src/app/features/clusterSetup/components/SetupClusterWizard.tsx`

- [ ] **Step 1: Add import + ref**

Open `src/app/features/clusterSetup/components/SetupClusterWizard.tsx`. At the top of the imports, add:

```ts
import { ResourceGroupStep, type ResourceGroupStepHandle } from './ResourceGroupStep';
```

Inside the component body, near the other `useState` hooks, add the ref:

```ts
const rgStepRef = React.useRef<ResourceGroupStepHandle>(null);
const [rgOutcome, setRgOutcome] = useState<
  | { status: 'created'; name: string }
  | { status: 'skipped' }
  | { status: 'error'; message: string }
  | null
>(null);
```

- [ ] **Step 2: Update Steps items to include resource group**

Replace the existing `<Steps ... items={...}/>` block with:

```tsx
<Steps
  current={step}
  size="small"
  style={{ marginBottom: 24 }}
  items={[
    { title: t('clusterSetup:step_nodes') },
    { title: t('clusterSetup:step_pools') },
    { title: t('clusterSetup:step_resource_group') },
    { title: t('clusterSetup:step_done') },
  ]}
/>
```

- [ ] **Step 3: Update submitPools to advance to step 2 (RG) instead of step 2 (Done)**

Find `submitPools` and change the `setStep(2)` calls at both branches (empty rows + after creation) to `setStep(2)`. The step index stays 2, but its meaning shifts to "Resource Group". Replace the `onCompleted()` call inside `submitPools` with leaving completion until after the user finishes / skips the RG step.

Look for these two lines and remove `onCompleted();` from both (keep `setStep(2)`):

Old:
```ts
    if (rows.length === 0) {
      // Skipping the pool step is allowed.
      setStep(2);
      onCompleted();
      return;
    }
```
New:
```ts
    if (rows.length === 0) {
      // Skipping the pool step is allowed.
      setStep(2);
      return;
    }
```

And:

Old:
```ts
    setStep(2);
    onCompleted();
  };
```
New:
```ts
    setStep(2);
  };
```

- [ ] **Step 4: Add RG step handlers**

Above the footer JSX add:

```ts
const submitRG = async () => {
  if (!rgStepRef.current) return;
  try {
    const result = await rgStepRef.current.submit();
    setRgOutcome({ status: 'created', name: result.name });
    message.success(t('clusterSetup:rg_created', { name: result.name }));
    setStep(3);
    onCompleted();
  } catch (err) {
    // Form validation errors throw synchronously; ignore so the user can fix
    // their inputs. Other errors come from the API.
    const msg = (err as Error)?.message;
    if (msg && msg !== 'Validation failed') {
      setRgOutcome({ status: 'error', message: msg });
      message.error(t('clusterSetup:rg_failed', { error: msg }));
    }
  }
};

const skipRG = async () => {
  if (rgStepRef.current) await rgStepRef.current.skip();
  setRgOutcome({ status: 'skipped' });
  setStep(3);
  onCompleted();
};
```

- [ ] **Step 5: Add the RG footer + body**

Inside the modal JSX, after the storage pools `{step === 1 && (...)}` block and BEFORE the existing done block `{step === 2 && (...)}`, insert a new step 2 body:

```tsx
{step === 2 && (
  <ResourceGroupStep
    ref={rgStepRef}
    nodeCount={successfulNodes.length}
  />
)}
```

Update the existing done block from `{step === 2 && ...}` to `{step === 3 && ...}`.

Then update the footer selector. Replace:

```ts
footer={step === 0 ? nodeFooter : step === 1 ? poolFooter : doneFooter}
```

with:

```ts
footer={
  step === 0
    ? nodeFooter
    : step === 1
      ? poolFooter
      : step === 2
        ? rgFooter
        : doneFooter
}
```

And add the new `rgFooter` next to the other footers (`nodeFooter`, `poolFooter`, `doneFooter`):

```tsx
const rgFooter = (
  <Space>
    <AntButton onClick={handleClose}>{t('common:cancel')}</AntButton>
    <AntButton onClick={() => setStep(1)}>{t('common:back')}</AntButton>
    <AntButton onClick={skipRG}>{t('common:skip')}</AntButton>
    <Button type="primary" onClick={submitRG}>
      {t('clusterSetup:create_resource_group')}
    </Button>
  </Space>
);
```

- [ ] **Step 6: Add RG outcome tag to the Done summary**

Inside `{step === 3 && (...)}` (formerly `step === 2`), after the storage-pool outcomes block, add:

```tsx
{rgOutcome && (
  <div style={{ marginTop: 12 }}>
    <Typography.Text strong>{t('clusterSetup:step_resource_group')}</Typography.Text>
    <div style={{ marginTop: 6 }}>
      {rgOutcome.status === 'created' && (
        <Tag color="green">{rgOutcome.name}</Tag>
      )}
      {rgOutcome.status === 'skipped' && (
        <Tag color="default">{t('clusterSetup:rg_skipped')}</Tag>
      )}
      {rgOutcome.status === 'error' && (
        <Tag color="red">{rgOutcome.message}</Tag>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 7: Reset RG state in reset()**

Find the `reset` function and add:

```ts
const reset = () => {
  setStep(0);
  setNodeOutcomes([]);
  setPoolOutcomes([]);
  setRgOutcome(null);
  nodeForm.resetFields();
  spForm.resetFields();
};
```

- [ ] **Step 8: Run tests to verify nothing else broke**

Run: `npx vitest run src/app/features/clusterSetup`
Expected: PASS — all clusterSetup tests still green.

- [ ] **Step 9: Type-check**

Run: `npx tsc --noEmit`
Expected: clean exit.

- [ ] **Step 10: Commit**

```bash
git add src/app/features/clusterSetup/components/SetupClusterWizard.tsx
git commit -m "feat(clusterSetup): insert optional resource group step in wizard"
```

---

## Task 7: SetupClusterCard layout + dismiss button

**Files:**
- Modify: `src/app/features/clusterSetup/components/SetupClusterCard.tsx`
- Test: `src/app/features/clusterSetup/__test__/SetupClusterCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/features/clusterSetup/__test__/SetupClusterCard.test.tsx
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { SetupClusterCard } from '../components/SetupClusterCard';

describe('SetupClusterCard', () => {
  it('renders the welcome title', () => {
    render(<SetupClusterCard onStart={() => undefined} onDismiss={() => undefined} />);
    expect(screen.getByText(/Welcome — let's set up your LINSTOR cluster/i)).toBeInTheDocument();
  });

  it('calls onStart when Get started is clicked', () => {
    const onStart = vi.fn();
    render(<SetupClusterCard onStart={onStart} onDismiss={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when Dismiss is clicked', () => {
    const onDismiss = vi.fn();
    render(<SetupClusterCard onStart={() => undefined} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/features/clusterSetup/__test__/SetupClusterCard.test.tsx`
Expected: FAIL — current component doesn't accept these props, no Dismiss button.

- [ ] **Step 3: Replace SetupClusterCard with the presentational version**

Replace the full contents of `src/app/features/clusterSetup/components/SetupClusterCard.tsx` with:

```tsx
// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Card, Space, Typography } from 'antd';
import { CloudServerOutlined, DatabaseOutlined, RocketOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@app/components/Button';

export interface SetupClusterCardProps {
  onStart: () => void;
  onDismiss: () => void;
}

export const SetupClusterCard: React.FC<SetupClusterCardProps> = ({ onStart, onDismiss }) => {
  const { t } = useTranslation(['clusterSetup', 'common']);

  return (
    <Card
      style={{
        borderColor: '#F79133',
        borderWidth: 2,
        background: 'linear-gradient(135deg, #fff8f1 0%, #ffffff 100%)',
      }}
      styles={{ body: { padding: 24 } }}
    >
      <Space size="large" align="start" style={{ width: '100%' }} wrap>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: 'rgba(247, 145, 51, 0.12)',
            color: '#F79133',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            flex: '0 0 auto',
          }}
        >
          <RocketOutlined />
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 8 }}>
            {t('clusterSetup:welcome_title')}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            {t('clusterSetup:welcome_description')}
          </Typography.Paragraph>
          <Space size={[24, 8]} wrap>
            <Space size={6}>
              <CloudServerOutlined style={{ color: '#F79133' }} />
              <Typography.Text>{t('clusterSetup:welcome_bullet_nodes')}</Typography.Text>
            </Space>
            <Space size={6}>
              <DatabaseOutlined style={{ color: '#F79133' }} />
              <Typography.Text>{t('clusterSetup:welcome_bullet_pools')}</Typography.Text>
            </Space>
          </Space>
        </div>
      </Space>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <Button type="default" onClick={onDismiss}>
          {t('clusterSetup:dismiss')}
        </Button>
        <Button type="primary" size="large" onClick={onStart}>
          {t('clusterSetup:get_started')}
        </Button>
      </div>
    </Card>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/features/clusterSetup/__test__/SetupClusterCard.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/clusterSetup/components/SetupClusterCard.tsx \
        src/app/features/clusterSetup/__test__/SetupClusterCard.test.tsx
git commit -m "feat(clusterSetup): bottom-aligned action row with dismiss button"
```

---

## Task 8: Dashboard visibility wiring

**Files:**
- Modify: `src/app/pages/Dashboard/Dashboard.tsx`
- Modify: `src/app/features/clusterSetup/index.ts`
- Test: `src/app/pages/Dashboard/__test__/Dashboard.test.tsx`

- [ ] **Step 1: Add the hook to clusterSetup barrel export**

Open `src/app/features/clusterSetup/index.ts` and append:

```ts
export { useClusterEmpty } from './hooks/useClusterEmpty';
```

Run: `grep -n "useClusterEmpty" src/app/features/clusterSetup/index.ts`
Expected: at least one line.

- [ ] **Step 2: Write the failing Dashboard test**

```tsx
// src/app/pages/Dashboard/__test__/Dashboard.test.tsx
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import Dashboard from '../Dashboard';
import { store } from '@app/store';
import { CLUSTER_SETUP_DISMISSED_KEY } from '@app/features/clusterSetup/dismiss';

const mockGetNodes = vi.fn();
vi.mock('@app/features/node/api', () => ({
  getNodes: (...args: unknown[]) => mockGetNodes(...args),
}));

vi.mock('@app/components/StoragePoolInfo', () => ({
  StoragePoolInfo: () => <div data-testid="storage-pool-info">SP</div>,
}));
vi.mock('@app/features/resource', () => ({
  FaultyList: () => <div data-testid="faulty-list">FL</div>,
}));
vi.mock('@app/features/clusterSetup/components/SetupClusterWizard', () => ({
  SetupClusterWizard: () => null,
}));

const renderDashboard = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockGetNodes.mockReset();
  });

  it('shows only SetupClusterCard when nodes list is empty', async () => {
    mockGetNodes.mockResolvedValueOnce({ data: [] });
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Welcome — let's set up your LINSTOR cluster/i)).toBeInTheDocument());
    expect(screen.queryByTestId('storage-pool-info')).not.toBeInTheDocument();
    expect(screen.queryByTestId('faulty-list')).not.toBeInTheDocument();
  });

  it('shows chart + faulty list when nodes exist', async () => {
    mockGetNodes.mockResolvedValueOnce({ data: [{ name: 'gui01' }] });
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('storage-pool-info')).toBeInTheDocument());
    expect(screen.queryByText(/Welcome — let's set up your LINSTOR cluster/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('faulty-list')).toBeInTheDocument();
  });

  it('shows chart + faulty list when cluster is empty but dismissed', async () => {
    window.localStorage.setItem(CLUSTER_SETUP_DISMISSED_KEY, 'true');
    mockGetNodes.mockResolvedValueOnce({ data: [] });
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('storage-pool-info')).toBeInTheDocument());
    expect(screen.queryByText(/Welcome — let's set up your LINSTOR cluster/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/app/pages/Dashboard/__test__/Dashboard.test.tsx`
Expected: FAIL — Dashboard still shows both card and chart.

- [ ] **Step 4: Rewrite Dashboard to consume useClusterEmpty**

Replace the full contents of `src/app/pages/Dashboard/Dashboard.tsx` with:

```tsx
// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { StoragePoolInfo } from '@app/components/StoragePoolInfo';
import { FaultyList } from '@app/features/resource';
import { SetupClusterCard, SetupClusterWizard, useClusterEmpty } from '@app/features/clusterSetup';

const Dashboard: React.FunctionComponent = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { empty, dismissed, isFetched, dismiss, refetch } = useClusterEmpty();
  const [wizardOpen, setWizardOpen] = useState(false);

  // Don't flash either layout before the node count resolves.
  if (!isFetched) {
    return <PageBasic title={t('dashboard:title')} />;
  }

  const showSetup = empty && !dismissed;

  return (
    <PageBasic title={t('dashboard:title')}>
      {showSetup ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <SetupClusterCard onStart={() => setWizardOpen(true)} onDismiss={dismiss} />
          </div>
          <SetupClusterWizard
            open={wizardOpen}
            onClose={() => setWizardOpen(false)}
            onCompleted={() => refetch()}
          />
        </>
      ) : (
        <>
          <StoragePoolInfo />
          <FaultyList />
        </>
      )}
    </PageBasic>
  );
};

export default Dashboard;
```

- [ ] **Step 5: Run the new test plus existing test suite**

Run: `npx vitest run src/app/pages/Dashboard src/app/features/clusterSetup`
Expected: PASS — all tests green.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: clean exit.

- [ ] **Step 7: Commit**

```bash
git add src/app/pages/Dashboard/Dashboard.tsx \
        src/app/pages/Dashboard/__test__/Dashboard.test.tsx \
        src/app/features/clusterSetup/index.ts
git commit -m "feat(dashboard): hide chart/faulty list while setup card is shown"
```

---

## Task 9: End-to-end check and cleanup

**Files:** none modified — verification only.

- [ ] **Step 1: Full test suite**

Run: `npm run test -- --reporter=basic`
Expected: all suites pass (existing count + ~5 new files).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: clean exit, no warnings beyond pre-existing chunk-size advisories.

- [ ] **Step 3: Manual smoke (dev server)**

Run: `npm run dev` on an empty mock scenario (`linstor-gui-mock` `empty` scenario already in the sibling repo) or against a controller with zero nodes.

Verify in the browser:
1. Dashboard shows only the orange welcome card; no Storage Pool chart, no faulty list.
2. Click `Dismiss` — card disappears, chart + faulty list appear. Reload — still dismissed.
3. Clear localStorage (devtools), reload — card is back.
4. Click `Get started` — wizard opens. Add nodes → Pools → Resource Group step is now visible.
5. On the RG step pick `Proxmox`, observe fields auto-fill, click `Create resource group`. Verify the API call body in the Network tab matches the Section 5 mapping from the spec.
6. Restart, this time click `Skip` on the RG step — wizard advances straight to Done with an RG-skipped tag.

- [ ] **Step 4: Commit any tweaks discovered during smoke**

If you find any UI string issues, missing translations, or layout glitches, fix and commit with a focused message (e.g. `fix(clusterSetup): polish HA warning copy`).

---

## Self-Review

| Spec section | Plan task |
|---|---|
| §1 Dashboard visibility | Task 3 (hook) + Task 8 (wiring + tests) |
| §2 Dismiss persistence | Task 2 (helpers) + Task 7 (card) |
| §3 Card bottom action row | Task 7 |
| §4 Wizard step layout | Task 6 |
| §5 Resource Group step UI | Task 5 + Task 6 |
| §6 Preset defaults | Task 1 |
| §7 i18n additions | Task 4 |
| §8 File touch list | Task 1–8 (each named in File Structure) |
| Testing requirements | Tasks 1, 2, 3, 5, 7, 8 |
| Open questions (ZFS preset, per-controller dismiss) | deliberately deferred — not in plan |

Placeholder scan: no TBDs, no "handle edge cases", every code block fully specified, every test step has the assertion code.

Type consistency: `PresetKey` defined in Task 1 is re-used in Task 5; `ResourceGroupStepHandle` defined in Task 5 is re-used in Task 6 imports; `SetupClusterCardProps` defined in Task 7 is consumed by Task 8.
