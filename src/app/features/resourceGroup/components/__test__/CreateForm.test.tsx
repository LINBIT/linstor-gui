// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18n from 'i18next';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  createResourceGroup: vi.fn(),
  addVolumeToResourceGroup: vi.fn(),
  updateResourceGroup: vi.fn(),
  getResourceGroups: vi.fn(),
  spawnResourceGroup: vi.fn(),
}));

vi.mock('@app/features/storagePool', () => ({
  useStoragePools: () => ({
    isLoading: false,
    // The same pool on two nodes must collapse to one option.
    data: [
      { storage_pool_name: 'pool-a', node_name: 'n1' },
      { storage_pool_name: 'pool-a', node_name: 'n2' },
      { storage_pool_name: 'pool-b', node_name: 'n1' },
      { storage_pool_name: 'diskless-a', node_name: 'n1', provider_kind: 'DISKLESS' },
      { storage_pool_name: 'diskless-a', node_name: 'n2', provider_kind: 'DISKLESS' },
    ],
  }),
}));

vi.mock('@app/features/node', () => ({
  useNodes: () => ({ data: [{ name: 'n1' }, { name: 'n2' }] }),
  getControllerVersion: vi.fn(),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

import {
  createResourceGroup,
  addVolumeToResourceGroup,
  updateResourceGroup,
  getResourceGroups,
  spawnResourceGroup,
} from '../../api';
import { getControllerVersion } from '@app/features/node';
import { CreateForm } from '../CreateForm';

const ok = { data: [{ ret_code: 1, message: 'ok' }] };
const failed = { data: [{ ret_code: -1, message: 'nope' }] };

const renderForm = (props: React.ComponentProps<typeof CreateForm> = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CreateForm {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const typeName = (name: string) =>
  fireEvent.change(screen.getByPlaceholderText('Please input resource group name'), { target: { value: name } });

const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

describe('resource group CreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createResourceGroup).mockResolvedValue(ok as never);
    vi.mocked(updateResourceGroup).mockResolvedValue(ok as never);
    vi.mocked(addVolumeToResourceGroup).mockResolvedValue(ok as never);
    vi.mocked(spawnResourceGroup).mockResolvedValue(ok as never);
    vi.mocked(getResourceGroups).mockResolvedValue({ data: [] } as never);
    vi.mocked(getControllerVersion).mockResolvedValue({ data: { version: '1.35.3' } } as never);
  });

  // antd spaces out a two-character Chinese button label (取 消).
  it('labels the second button Cancel when creating and Back when editing, in the UI language', async () => {
    await i18n.changeLanguage('zh');
    try {
      const { unmount } = renderForm();
      expect(await screen.findByRole('button', { name: /^取\s?消$/ })).toBeInTheDocument();
      unmount();
      renderForm({ isEdit: true, resourceGroup: 'rg-edit' });
      expect(await screen.findByRole('button', { name: /^返\s?回$/ })).toBeInTheDocument();
    } finally {
      cleanup();
      await i18n.changeLanguage('en');
    }
  });

  it('refuses to submit without a name', async () => {
    renderForm();
    submit();
    expect(await screen.findByText('Resource group name is required!')).toBeInTheDocument();
    expect(createResourceGroup).not.toHaveBeenCalled();
  });

  it('creates the group, then adds the first volume group, then goes back', async () => {
    renderForm();
    typeName('rg-new');
    fireEvent.change(screen.getByPlaceholderText('Please input description'), { target: { value: 'for tests' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } });
    submit();

    await waitFor(() => expect(createResourceGroup).toHaveBeenCalled());
    const body = vi.mocked(createResourceGroup).mock.calls[0][0];
    expect(body.name).toBe('rg-new');
    expect(body.description).toBe('for tests');
    // The number input hands back a string; the request must carry a number.
    expect(body.select_filter?.place_count).toBe(3);
    // Not chosen: left to the controller.
    expect(body.select_filter?.storage_pool_diskless_list).toBeUndefined();
    expect(body.select_filter?.node_name_list).toBeUndefined();
    expect(body.select_filter?.x_replicas_on_different_map).toBeUndefined();

    await waitFor(() => expect(addVolumeToResourceGroup).toHaveBeenCalledWith('rg-new', {}));
    expect(updateResourceGroup).toHaveBeenCalledWith('rg-new', {});
    expect(spawnResourceGroup).not.toHaveBeenCalled();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
  });

  it('stops after a failed create and stays on the page', async () => {
    vi.mocked(createResourceGroup).mockResolvedValue(failed as never);
    renderForm();
    typeName('rg-bad');
    submit();

    await waitFor(() => expect(createResourceGroup).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(addVolumeToResourceGroup).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('spawns a resource after creation when spawn-on-create is on', async () => {
    renderForm();
    typeName('rg-spawn');
    fireEvent.click(screen.getByRole('switch'));

    const rdName = await screen.findByPlaceholderText('Please input resource definition group name');
    fireEvent.change(rdName, { target: { value: 'res-1' } });
    // SizeInput: the second number input on the page, GiB by default.
    const [, size] = screen.getAllByRole('spinbutton');
    fireEvent.change(size, { target: { value: '2' } });
    submit();

    await waitFor(() => expect(spawnResourceGroup).toHaveBeenCalled());
    const [rg, spawn] = vi.mocked(spawnResourceGroup).mock.calls[0];
    expect(rg).toBe('rg-spawn');
    expect(spawn).toMatchObject({
      resource_definition_name: 'res-1',
      volume_sizes: [2 * 1024 * 1024],
      partial: false,
      definitions_only: false,
    });
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
  });

  it('offers each storage pool once even when it exists on several nodes', async () => {
    renderForm();
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    const options = await screen.findAllByText(/^pool-/, { selector: '.ant-select-item-option-content' });
    expect(options.map((o) => o.textContent)).toEqual(['pool-a', 'pool-b']);
  });

  it('hides the advanced placement fields until asked', () => {
    renderForm();
    expect(screen.queryByText('Replicas On Same')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Show advanced setting'));
    expect(screen.getByText('Replicas On Same')).toBeInTheDocument();
    expect(screen.getByText('Do Not Place With Regex')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hide advanced settings'));
    expect(screen.queryByText('Replicas On Same')).not.toBeInTheDocument();
  });

  const formItem = (label: string) =>
    Array.from(document.querySelectorAll('.ant-form-item')).find((el) =>
      el.querySelector('label')?.textContent?.includes(label),
    ) as HTMLElement;
  const selectIn = (label: string) => formItem(label).querySelector('[role="combobox"]') as HTMLElement;
  const layerSelect = () => selectIn('LINSTOR Layers');
  const pick = async (label: string, option: string) => {
    fireEvent.mouseDown(selectIn(label));
    fireEvent.click(await screen.findByText(option, { selector: '.ant-select-item-option-content' }));
  };

  it('offers only diskless storage pools as diskless storage pools, and sends the one chosen', async () => {
    renderForm();
    typeName('rg-dl');
    fireEvent.mouseDown(selectIn('Diskless Storage Pools'));
    const options = await screen.findAllByText(/./, { selector: '.ant-select-item-option-content' });
    expect(options.map((o) => o.textContent)).toEqual(['diskless-a']);
    fireEvent.click(options[0]);
    fireEvent.click(screen.getByText('Show advanced setting'));
    await pick('Nodes', 'n2');
    submit();

    await waitFor(() => expect(createResourceGroup).toHaveBeenCalled());
    const filter = vi.mocked(createResourceGroup).mock.calls[0][0].select_filter;
    expect(filter?.storage_pool_diskless_list).toEqual(['diskless-a']);
    expect(filter?.node_name_list).toEqual(['n2']);
  });

  it('offers exactly the layers the controller accepts', async () => {
    renderForm();
    fireEvent.mouseDown(layerSelect());

    const options = await screen.findAllByText(/./, { selector: '.ant-select-item-option-content' });
    // "writechache", "openflex" and "exos" used to be offered; the controller
    // rejects all three as invalid layer kinds. "bcache" was missing.
    expect(options.map((o) => o.textContent).filter((t) => !t?.startsWith('pool-'))).toEqual([
      'cache',
      'storage',
      'drbd',
      'nvme',
      'luks',
      'writecache',
      'bcache',
    ]);
  });

  it('sends the writecache layer under the name the controller knows', async () => {
    renderForm();
    typeName('rg-wc');
    fireEvent.mouseDown(layerSelect());
    fireEvent.click(await screen.findByText('writecache', { selector: '.ant-select-item-option-content' }));
    submit();

    await waitFor(() => expect(createResourceGroup).toHaveBeenCalled());
    expect(vi.mocked(createResourceGroup).mock.calls[0][0].select_filter?.layer_stack).toEqual(['writecache']);
  });

  it('reminds about the kernel module when DRBD joins the layer stack', async () => {
    renderForm();
    fireEvent.mouseDown(layerSelect());
    fireEvent.click(await screen.findByText('drbd', { selector: '.ant-select-item-option-content' }));

    expect(
      await screen.findByText('Please make sure you have drbd-kmod installed on the nodes you wish to use DRBD on'),
    ).toBeInTheDocument();
  });

  it('still goes back when spawning after the create fails outright', async () => {
    // The group and its volume group exist by then; the list is where to retry.
    vi.mocked(spawnResourceGroup).mockRejectedValue(new Error('Failed to fetch'));
    renderForm();
    typeName('rg-spawn');
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(await screen.findByPlaceholderText('Please input resource definition group name'), {
      target: { value: 'res-1' },
    });
    const [, size] = screen.getAllByRole('spinbutton');
    fireEvent.change(size, { target: { value: '2' } });
    submit();

    await waitFor(() => expect(spawnResourceGroup).toHaveBeenCalled());
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
  });

  describe('edit mode', () => {
    const existing = {
      name: 'rg-edit',
      description: 'old text',
      select_filter: {
        place_count: 3,
        storage_pool_list: ['pool-a'],
        layer_stack: ['DRBD', 'STORAGE'],
        provider_list: ['LVM_THIN'],
        diskless_on_remaining: true,
        storage_pool_diskless_list: ['diskless-a'],
        node_name_list: ['n1'],
        replicas_on_different: ['Aux/site'],
        x_replicas_on_different_map: { 'Aux/site': 2 },
      },
    };

    const loaded = async () => {
      const description = await screen.findByPlaceholderText('Please input description');
      await waitFor(() => expect(description).toHaveValue('old text'));
      return description;
    };

    beforeEach(() => {
      vi.mocked(getResourceGroups).mockResolvedValue({ data: [existing] } as never);
    });

    it('loads the group and locks its name', async () => {
      renderForm({ isEdit: true, resourceGroup: 'rg-edit' });
      const name = await screen.findByPlaceholderText('Please input resource group name');
      await waitFor(() => expect(name).toHaveValue('rg-edit'));
      expect(name).toBeDisabled();
      expect(screen.getByPlaceholderText('Please input description')).toHaveValue('old text');
      expect(screen.getByRole('spinbutton')).toHaveValue(3);
      expect(getResourceGroups).toHaveBeenCalledWith({ resource_groups: ['rg-edit'] });
      // Spawn-on-create makes no sense for an existing group.
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    it('submits a modify request, lower-casing nothing the server gave in upper case', async () => {
      renderForm({ isEdit: true, resourceGroup: 'rg-edit' });
      const description = await screen.findByPlaceholderText('Please input description');
      await waitFor(() => expect(description).toHaveValue('old text'));
      fireEvent.change(description, { target: { value: 'new text' } });
      submit();

      await waitFor(() => expect(updateResourceGroup).toHaveBeenCalled());
      const [rg, body] = vi.mocked(updateResourceGroup).mock.calls[0];
      expect(rg).toBe('rg-edit');
      expect(body.description).toBe('new text');
      expect(body.select_filter).toMatchObject({
        place_count: 3,
        storage_pool_list: ['pool-a'],
        layer_stack: ['drbd', 'storage'],
        provider_list: ['lvm_thin'],
        diskless_on_remaining: true,
      });
      expect(createResourceGroup).not.toHaveBeenCalled();
      expect(addVolumeToResourceGroup).not.toHaveBeenCalled();
      await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
    });

    it('stays on the page when the modify request fails', async () => {
      vi.mocked(updateResourceGroup).mockRejectedValue(new Error('boom'));
      renderForm({ isEdit: true, resourceGroup: 'rg-edit' });
      const description = await screen.findByPlaceholderText('Please input description');
      await waitFor(() => expect(description).toHaveValue('old text'));
      submit();
      await waitFor(() => expect(updateResourceGroup).toHaveBeenCalled());
      await new Promise((r) => setTimeout(r, 20));
      expect(navigate).not.toHaveBeenCalled();
    });

    it('keeps what it does not change: diskless storage pools, nodes and x-replicas-on-different', async () => {
      renderForm({ isEdit: true, resourceGroup: 'rg-edit' });
      fireEvent.change(await loaded(), { target: { value: 'new text' } });
      submit();

      await waitFor(() => expect(updateResourceGroup).toHaveBeenCalled());
      const filter = vi.mocked(updateResourceGroup).mock.calls[0][1].select_filter;
      // Left out of the request, so the controller keeps them; [] or {} would clear them.
      expect(filter?.storage_pool_diskless_list).toBeUndefined();
      expect(filter?.node_name_list).toBeUndefined();
      expect(filter?.x_replicas_on_different_map).toBeUndefined();
    });

    it('shows the diskless storage pools and nodes of the group, and sends them once changed', async () => {
      renderForm({ isEdit: true, resourceGroup: 'rg-edit' });
      await loaded();
      fireEvent.click(screen.getByText('Show advanced setting'));
      await waitFor(() => expect(formItem('Diskless Storage Pools')).toHaveTextContent('diskless-a'));
      expect(formItem('Nodes')).toHaveTextContent('n1');

      await pick('Nodes', 'n2');
      submit();

      await waitFor(() => expect(updateResourceGroup).toHaveBeenCalled());
      const filter = vi.mocked(updateResourceGroup).mock.calls[0][1].select_filter;
      expect(filter?.node_name_list).toEqual(['n1', 'n2']);
      expect(filter?.storage_pool_diskless_list).toBeUndefined();
    });

    it('says when the controller does not report these settings', async () => {
      vi.mocked(getControllerVersion).mockResolvedValue({ data: { version: '1.35.2' } } as never);
      renderForm({ isEdit: true, resourceGroup: 'rg-edit' });
      await loaded();
      expect(
        await screen.findByText(
          'This LINSTOR version does not report the current setting; it is kept unless you choose here.',
        ),
      ).toBeInTheDocument();
    });
  });
});
