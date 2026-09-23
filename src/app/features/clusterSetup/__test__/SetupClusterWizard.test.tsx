// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SetupClusterWizard } from '../components/SetupClusterWizard';
import { createNode } from '@app/features/node/api';
import { createPhysicalStorage, createStoragePool, getPhysicalStoragePoolByNode } from '@app/features/storagePool';
import { createResourceGroup, updateResourceGroup } from '@app/features/resourceGroup';

vi.mock('@app/features/node/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/node/api')>()),
  createNode: vi.fn(),
}));

vi.mock('@app/features/storagePool', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/storagePool')>()),
  createPhysicalStorage: vi.fn(),
  createStoragePool: vi.fn(),
  getPhysicalStoragePoolByNode: vi.fn(),
}));

vi.mock('@app/features/resourceGroup', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/resourceGroup')>()),
  createResourceGroup: vi.fn(),
  updateResourceGroup: vi.fn(),
}));

// The HA guide has its own suite and is only shown after a run.
vi.mock('../components/HASetupGuide', () => ({
  HASetupGuide: ({ storagePool, nodes }: { storagePool?: string; nodes?: string[] }) => (
    <div data-testid="ha-guide" data-pool={storagePool ?? ''} data-nodes={(nodes ?? []).join(',')} />
  ),
}));

// openapi-fetch resolves on every status: a 2xx body lands in `data`, anything
// else in `error`. These are the two shapes the controller can hand back.
const ok = { data: [{ ret_code: 1, message: 'ok' }] };
const rejected = (message: string) => ({ error: [{ ret_code: -4611686018427387904, message }] });

const renderWizard = () => {
  const onClose = vi.fn();
  const onCompleted = vi.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  const utils = render(
    <QueryClientProvider client={client}>
      <SetupClusterWizard open onClose={onClose} onCompleted={onCompleted} />
    </QueryClientProvider>,
  );
  return { ...utils, onClose, onCompleted };
};

const button = (name: string) => screen.getByRole('button', { name });

// The modal's own X is also named "Close"; the wizard's buttons live in the footer.
const footerButton = (name: string) =>
  Array.from(document.querySelectorAll('.ant-modal-footer button')).find(
    (el) => el.textContent === name,
  ) as HTMLElement;

// The service picker is a controlled Select outside any named Form.Item, so it
// has no label association; find it through its form item.
const serviceSelect = () => {
  const item = Array.from(document.querySelectorAll('.ant-form-item')).find(
    (el) => el.querySelector('label')?.textContent === 'Service',
  ) as HTMLElement;
  return item.querySelector('[role="combobox"]') as HTMLElement;
};

const pickOption = async (combobox: HTMLElement, title: string) => {
  fireEvent.mouseDown(combobox);
  const option = await waitFor(() => {
    const found = document.querySelector(`.ant-select-item[title="${title}"] .ant-select-item-option-content`);
    expect(found).not.toBeNull();
    return found as HTMLElement;
  });
  fireEvent.click(option);
};

/** Step 0: fill the node rows (adding rows past the first one). */
const fillNodes = (nodes: Array<{ name: string; ip: string }>) => {
  nodes.forEach((_, i) => {
    if (i > 0) fireEvent.click(button('plus Add another node'));
  });
  const names = screen.getAllByPlaceholderText('node01');
  const ips = screen.getAllByPlaceholderText('10.0.0.1');
  nodes.forEach((n, i) => {
    fireEvent.change(names[i], { target: { value: n.name } });
    fireEvent.change(ips[i], { target: { value: n.ip } });
  });
};

const toPoolStep = async (nodes = [{ name: 'gui01', ip: '10.0.0.1' }]) => {
  fillNodes(nodes);
  fireEvent.click(button('Next'));
  await screen.findByText('Storage pool name');
};

const toResourceGroupStep = async (source = 'vg1/pool1') => {
  fireEvent.change(screen.getByLabelText(/Device \/ pool/), { target: { value: source } });
  fireEvent.click(button('Next'));
  await screen.findByText('Resource group name');
};

const toReview = async (rgName = 'vm-data') => {
  fireEvent.change(screen.getByPlaceholderText('vm-data'), { target: { value: rgName } });
  fireEvent.click(button('Next'));
  await screen.findByRole('button', { name: 'Create cluster' });
};

const create = async () => {
  fireEvent.click(button('Create cluster'));
  await waitFor(() => expect(footerButton('Close')).toBeDefined());
};

describe('SetupClusterWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createNode).mockResolvedValue(ok as never);
    vi.mocked(createStoragePool).mockResolvedValue(ok as never);
    vi.mocked(createPhysicalStorage).mockResolvedValue(ok as never);
    vi.mocked(createResourceGroup).mockResolvedValue(ok as never);
    vi.mocked(updateResourceGroup).mockResolvedValue(ok as never);
    vi.mocked(getPhysicalStoragePoolByNode).mockResolvedValue({ data: [] } as never);
  });

  describe('node step', () => {
    it('will not move on without a name and an address', async () => {
      renderWizard();
      fireEvent.click(button('Next'));

      // Each field validates on its own tick.
      await waitFor(() => expect(screen.getAllByText('Required')).toHaveLength(2));
      expect(screen.queryByText('Storage pool name')).toBeNull();
    });

    it('keeps at least one node row', () => {
      renderWizard();

      const remove = () => screen.getAllByRole('button', { name: 'minus-circle' });
      expect(remove()[0]).toBeDisabled();

      fireEvent.click(button('plus Add another node'));
      expect(screen.getAllByPlaceholderText('node01')).toHaveLength(2);
      expect(remove()[0]).toBeEnabled();

      fireEvent.click(remove()[1]);
      expect(screen.getAllByPlaceholderText('node01')).toHaveLength(1);
    });

    it('closes on cancel without creating anything', () => {
      const { onClose } = renderWizard();
      fireEvent.click(button('Cancel'));

      expect(onClose).toHaveBeenCalled();
      expect(createNode).not.toHaveBeenCalled();
    });
  });

  describe('storage pool step', () => {
    it('applies one pool config to every planned node and says so', async () => {
      renderWizard();
      await toPoolStep([
        { name: 'gui01', ip: '10.0.0.1' },
        { name: 'gui02', ip: '10.0.0.2' },
      ]);

      expect(screen.getByText('This pool is created on every node: gui01, gui02')).toBeInTheDocument();
      expect(screen.getByLabelText('Storage pool name')).toHaveValue('lvm-thin-pool');
    });

    it('needs a device or pool before moving on', async () => {
      renderWizard();
      await toPoolStep();

      fireEvent.click(button('Next'));
      expect(await screen.findByText('Required')).toBeInTheDocument();
      expect(screen.queryByText('Resource group name')).toBeNull();
    });

    it('offers the first node’s block devices in new-device mode', async () => {
      vi.mocked(getPhysicalStoragePoolByNode).mockResolvedValue({
        data: [{ device: '/dev/sdb', size: 10 * 1024 * 1024 * 1024 }, { device: '' }, { size: 1 }],
      } as never);
      renderWizard();
      await toPoolStep();

      fireEvent.click(screen.getByText('New device'));

      await waitFor(() => expect(getPhysicalStoragePoolByNode).toHaveBeenCalledWith({ node: 'gui01' }));
      await pickOption(screen.getByRole('combobox', { name: /Device \/ pool/ }), '/dev/sdb (10.00 GiB)');
      // Entries without a device path are not offered.
      expect(document.querySelectorAll('.ant-select-item-option')).toHaveLength(1);
    });

    it('goes back to the nodes it was given', async () => {
      renderWizard();
      await toPoolStep();

      fireEvent.click(button('Back'));
      expect(await screen.findByPlaceholderText('node01')).toBeInTheDocument();
    });
  });

  describe('review', () => {
    it('lists what will be created before anything is sent', async () => {
      renderWizard();
      await toPoolStep([
        { name: 'gui01', ip: '10.0.0.1' },
        { name: 'gui02', ip: '10.0.0.2' },
      ]);
      await toResourceGroupStep();
      await toReview();

      expect(screen.getByText('gui01 (10.0.0.1:3366)')).toBeInTheDocument();
      expect(screen.getByText(/lvm-thin-pool \(LVM_THIN: vg1\/pool1\)/)).toHaveTextContent('gui01, gui02');
      expect(screen.getByText('vm-data')).toBeInTheDocument();
      expect(createNode).not.toHaveBeenCalled();
    });

    it('shows None for the steps that were skipped', async () => {
      renderWizard();
      await toPoolStep();
      fireEvent.click(button('Skip'));
      await screen.findByText('Resource group name');
      fireEvent.click(button('Skip'));
      await screen.findByRole('button', { name: 'Create cluster' });

      expect(screen.getAllByText('None')).toHaveLength(2);
    });
  });

  describe('create run', () => {
    it('creates nodes, then pools, then the resource group, and reports each', async () => {
      const { onCompleted, onClose } = renderWizard();
      await toPoolStep([
        { name: 'gui01', ip: '10.0.0.1' },
        { name: 'gui02', ip: '10.0.0.2' },
      ]);
      await toResourceGroupStep();
      await toReview();
      await create();

      expect(createNode).toHaveBeenNthCalledWith(1, {
        name: 'gui01',
        type: 'Satellite',
        net_interfaces: [
          {
            name: 'default',
            address: '10.0.0.1',
            satellite_port: 3366,
            satellite_encryption_type: 'PLAIN',
            is_active: true,
          },
        ],
      });
      expect(createStoragePool).toHaveBeenCalledWith('gui02', {
        storage_pool_name: 'lvm-thin-pool',
        provider_kind: 'LVM_THIN',
        props: { 'StorDriver/LvmVg': 'vg1/pool1' },
      });
      expect(createResourceGroup).toHaveBeenCalledWith({ name: 'vm-data', select_filter: { place_count: 2 } });
      // No DRBD options were chosen, so there is nothing to apply afterwards.
      expect(updateResourceGroup).not.toHaveBeenCalled();

      expect(screen.getByText('Cluster set up successfully')).toBeInTheDocument();
      expect(screen.getByTestId('ha-guide')).toHaveAttribute('data-pool', 'lvm-thin-pool');
      expect(screen.getByTestId('ha-guide')).toHaveAttribute('data-nodes', 'gui01,gui02');

      // The dashboard only re-checks once the summary has been read.
      expect(onCompleted).not.toHaveBeenCalled();
      fireEvent.click(footerButton('Close'));
      expect(onCompleted).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('points a ZFS pool at the zpool and a file pool at nothing', async () => {
      renderWizard();
      await toPoolStep();
      await pickOption(screen.getByRole('combobox', { name: 'Provider' }), 'ZFS');
      await toResourceGroupStep('tank');
      fireEvent.click(button('Skip'));
      await screen.findByRole('button', { name: 'Create cluster' });
      await create();

      expect(createStoragePool).toHaveBeenCalledWith('gui01', {
        storage_pool_name: 'lvm-thin-pool',
        provider_kind: 'ZFS',
        props: { 'StorDriver/ZPool': 'tank' },
      });
    });

    it('prepares a new device through physical-storage instead', async () => {
      vi.mocked(getPhysicalStoragePoolByNode).mockResolvedValue({ data: [{ device: '/dev/sdb' }] } as never);
      renderWizard();
      await toPoolStep();
      fireEvent.click(screen.getByText('New device'));
      await pickOption(screen.getByRole('combobox', { name: /Device \/ pool/ }), '/dev/sdb');
      fireEvent.click(button('Next'));
      await screen.findByText('Resource group name');
      fireEvent.click(button('Skip'));
      await screen.findByRole('button', { name: 'Create cluster' });
      await create();

      expect(createPhysicalStorage).toHaveBeenCalledWith('gui01', {
        provider_kind: 'LVM_THIN',
        device_paths: ['/dev/sdb'],
        pool_name: 'lvm-thin-pool',
        with_storage_pool: { name: 'lvm-thin-pool' },
      });
      expect(createStoragePool).not.toHaveBeenCalled();
    });

    it('applies the preset DRBD options with a follow-up modify', async () => {
      renderWizard();
      await toPoolStep();
      await toResourceGroupStep();
      await pickOption(serviceSelect(), 'VM');
      fireEvent.click(button('Next'));
      await screen.findByRole('button', { name: 'Create cluster' });
      await create();

      // The create endpoint ignores props, so they have to follow separately.
      expect(createResourceGroup).toHaveBeenCalledWith(expect.not.objectContaining({ props: expect.anything() }));
      expect(updateResourceGroup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ override_props: expect.any(Object) }),
      );
    });

    it('reports a node the controller rejects, and skips its pool', async () => {
      vi.mocked(createNode).mockImplementation((body) =>
        Promise.resolve((body.name === 'gui02' ? rejected("Node 'gui02' already exists") : ok) as never),
      );
      renderWizard();
      await toPoolStep([
        { name: 'gui01', ip: '10.0.0.1' },
        { name: 'gui02', ip: '10.0.0.2' },
      ]);
      await toResourceGroupStep();
      fireEvent.click(button('Skip'));
      await screen.findByRole('button', { name: 'Create cluster' });
      await create();

      expect(screen.getByText("gui02: Node 'gui02' already exists")).toBeInTheDocument();
      expect(createStoragePool).toHaveBeenCalledTimes(1);
      expect(createStoragePool).toHaveBeenCalledWith('gui01', expect.anything());
      expect(screen.getByText('gui02 / lvm-thin-pool: skipped — node was not created')).toBeInTheDocument();
      expect(screen.queryByText('Cluster set up successfully')).toBeNull();
      expect(screen.getByText('Cluster setup finished with errors')).toBeInTheDocument();
    });

    it('reports a node the controller rejects inside a successful response', async () => {
      vi.mocked(createNode).mockResolvedValue({
        data: [{ ret_code: -1, message: 'satellite unreachable' }],
      } as never);
      renderWizard();
      await toPoolStep();
      fireEvent.click(button('Skip'));
      await screen.findByText('Resource group name');
      fireEvent.click(button('Skip'));
      await screen.findByRole('button', { name: 'Create cluster' });
      await create();

      expect(screen.getByText('gui01: satellite unreachable')).toBeInTheDocument();
    });

    it('reports a node whose request never reached the controller', async () => {
      vi.mocked(createNode).mockRejectedValue(new Error('Failed to fetch'));
      renderWizard();
      await toPoolStep();
      fireEvent.click(button('Skip'));
      await screen.findByText('Resource group name');
      fireEvent.click(button('Skip'));
      await screen.findByRole('button', { name: 'Create cluster' });
      await create();

      expect(screen.getByText('gui01: Failed to fetch')).toBeInTheDocument();
    });

    it('reports a storage pool the controller rejects', async () => {
      vi.mocked(createStoragePool).mockResolvedValue(rejected("Volume group 'vg1' not found") as never);
      renderWizard();
      await toPoolStep();
      await toResourceGroupStep();
      fireEvent.click(button('Skip'));
      await screen.findByRole('button', { name: 'Create cluster' });
      await create();

      expect(screen.getByText("gui01 / lvm-thin-pool: Volume group 'vg1' not found")).toBeInTheDocument();
      expect(screen.getByText('Cluster setup finished with errors')).toBeInTheDocument();
    });

    it('reports a resource group the controller rejects and does not try to modify it', async () => {
      vi.mocked(createResourceGroup).mockResolvedValue(rejected("Resource group 'vm-data' already exists") as never);
      renderWizard();
      await toPoolStep();
      await toResourceGroupStep();
      await pickOption(serviceSelect(), 'VM');
      fireEvent.click(button('Next'));
      await screen.findByRole('button', { name: 'Create cluster' });
      await create();

      expect(screen.getByText(/already exists/)).toBeInTheDocument();
      expect(updateResourceGroup).not.toHaveBeenCalled();
      expect(screen.getByText('Cluster setup finished with errors')).toBeInTheDocument();
    });

    it('reports DRBD options the controller refuses to apply', async () => {
      vi.mocked(updateResourceGroup).mockResolvedValue(rejected('Invalid property') as never);
      renderWizard();
      await toPoolStep();
      await toResourceGroupStep();
      await pickOption(serviceSelect(), 'VM');
      fireEvent.click(button('Next'));
      await screen.findByRole('button', { name: 'Create cluster' });
      await create();

      expect(screen.getByText(/Invalid property/)).toBeInTheDocument();
      expect(screen.getByText('Cluster setup finished with errors')).toBeInTheDocument();
    });
    it('reports an error body that is not an ApiCallRc list', async () => {
      // e.g. a reverse proxy in front of the controller answering 502.
      vi.mocked(createNode).mockResolvedValue({ error: { message: 'Bad Gateway' } } as never);
      renderWizard();
      await toPoolStep();
      fireEvent.click(button('Skip'));
      await screen.findByText('Resource group name');
      fireEvent.click(button('Skip'));
      await screen.findByRole('button', { name: 'Create cluster' });
      await create();

      expect(screen.getByText('gui01: Bad Gateway')).toBeInTheDocument();
    });

    it('describes rejections that are not Error objects', async () => {
      vi.mocked(createStoragePool).mockRejectedValue('socket hang up');
      vi.mocked(createResourceGroup).mockRejectedValue([{ message: 'first' }, { message: 'second' }]);
      renderWizard();
      await toPoolStep();
      await toResourceGroupStep();
      await toReview();
      await create();

      expect(screen.getByText('gui01 / lvm-thin-pool: socket hang up')).toBeInTheDocument();
      expect(screen.getByText('vm-data: first; second')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('walks back from the review to the resource group and the pools', async () => {
      renderWizard();
      await toPoolStep();
      await toResourceGroupStep();
      await toReview();

      fireEvent.click(footerButton('Back'));
      expect(await screen.findByText('Resource group name')).toBeInTheDocument();

      fireEvent.click(footerButton('Back'));
      expect(await screen.findByText('Storage pool name')).toBeInTheDocument();
      expect(createNode).not.toHaveBeenCalled();
    });
  });
});
