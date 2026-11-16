// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import { CreateForm } from '../CreateForm';
import {
  createResourceDefinition,
  createVolumeDefinition,
  autoPlace,
  updateResourceDefinition,
  deleteResourceDefinition,
} from '../../api';
import { renderWithClient, selectOption, ok, failed } from './helpers';

vi.mock('../../api', () => ({
  createResourceDefinition: vi.fn(),
  createVolumeDefinition: vi.fn(),
  autoPlace: vi.fn(),
  updateResourceDefinition: vi.fn(),
  deleteResourceDefinition: vi.fn(),
}));

const POOLS = vi.hoisted(() => [
  { storage_pool_name: 'sp1', node_name: 'n1', provider_kind: 'LVM_THIN' },
  { storage_pool_name: 'sp1', node_name: 'n2', provider_kind: 'LVM_THIN' },
  { storage_pool_name: 'sp2', node_name: 'n3', provider_kind: 'LVM' },
  { storage_pool_name: 'DfltDisklessStorPool', node_name: 'n4', provider_kind: 'DISKLESS' },
]);

const hoisted = vi.hoisted(() => ({
  navigate: vi.fn(),
  groups: { isLoading: false, data: [{ name: 'DfltRscGrp' }, { name: 'rg1' }] as unknown },
  pools: { isLoading: false, data: POOLS as unknown },
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => hoisted.navigate,
}));

vi.mock('@app/features/resourceGroup', () => ({ useResourceGroups: () => hoisted.groups }));
vi.mock('@app/features/storagePool', () => ({ useStoragePools: () => hoisted.pools }));

vi.mock('@app/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const GIB = 1024 * 1024;

const nameInput = () => screen.getByPlaceholderText('Please input resource definition name');
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

const expectedDefinition = (name: string, protocol = 'C', group = 'DfltRscGrp') => ({
  resource_definition: {
    name,
    props: { 'DrbdOptions/Net/protocol': protocol, 'DrbdOptions/PeerDevice/c-max-rate': '4194304' },
    resource_group_name: group,
    volume_definitions: [],
  },
});

describe('resourceDefinition CreateForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    hoisted.groups = { isLoading: false, data: [{ name: 'DfltRscGrp' }, { name: 'rg1' }] };
    hoisted.pools = { isLoading: false, data: POOLS };
    vi.mocked(createResourceDefinition).mockResolvedValue(ok as never);
    vi.mocked(createVolumeDefinition).mockResolvedValue(ok as never);
    vi.mocked(autoPlace).mockResolvedValue(ok as never);
    vi.mocked(updateResourceDefinition).mockResolvedValue(ok as never);
    vi.mocked(deleteResourceDefinition).mockResolvedValue(ok as never);
  });

  it('validates the name', async () => {
    renderWithClient(<CreateForm />);

    submit();
    expect(await screen.findByText('Resource definition name is required!')).toBeInTheDocument();

    fireEvent.change(nameInput(), { target: { value: 'bad name!' } });
    expect(await screen.findByText('Resource definition name is invalid!')).toBeInTheDocument();
    expect(createResourceDefinition).not.toHaveBeenCalled();
  });

  it('creates a definition in the default group without spawning', async () => {
    renderWithClient(<CreateForm />);

    expect(screen.getByRole('switch', { name: 'Spawn on create' })).not.toBeChecked();
    expect(screen.queryByPlaceholderText('Please input size')).toBeNull();
    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    submit();

    await waitFor(() => expect(createResourceDefinition).toHaveBeenCalledWith(expectedDefinition('rd9')));
    expect(createVolumeDefinition).not.toHaveBeenCalled();
    expect(autoPlace).not.toHaveBeenCalled();
    await waitFor(() => expect(hoisted.navigate).toHaveBeenCalledWith(-1));
  });

  it('offers the resource groups and the replication modes', async () => {
    renderWithClient(<CreateForm />);

    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    await selectOption(screen.getByRole('combobox'), 'rg1');
    fireEvent.click(screen.getByLabelText('Asynchronous(A)'));
    submit();

    await waitFor(() => expect(createResourceDefinition).toHaveBeenCalledWith(expectedDefinition('rd9', 'A', 'rg1')));
  });

  it('spawns with a volume, place count and diskless flag', async () => {
    renderWithClient(<CreateForm />);

    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    fireEvent.click(screen.getByRole('switch'));
    // The size field follows the switch one render later.
    await screen.findByPlaceholderText('Please input size');
    submit();
    expect(await screen.findByText('Size is required when spawn-on-create is enabled!')).toBeInTheDocument();
    expect(createResourceDefinition).not.toHaveBeenCalled();

    fireEvent.change(await screen.findByPlaceholderText('Please input size'), { target: { value: '1' } });
    const placeCount = screen.getByRole('spinbutton', { name: 'Place Count' }) as HTMLInputElement;
    expect(placeCount.value).toBe('2');
    fireEvent.change(placeCount, { target: { value: '3' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Diskless on remaining' }));
    submit();

    await waitFor(() => expect(createResourceDefinition).toHaveBeenCalledWith(expectedDefinition('rd9')));
    await waitFor(() =>
      expect(createVolumeDefinition).toHaveBeenCalledWith('rd9', { volume_definition: { size_kib: GIB, props: {} } }),
    );
    await waitFor(() =>
      expect(autoPlace).toHaveBeenCalledWith('rd9', { diskless_on_remaining: true, select_filter: { place_count: 3 } }),
    );
    await waitFor(() => expect(hoisted.navigate).toHaveBeenCalledWith(-1));
  });

  it('removes the new definition and stays on the form when the placement request fails', async () => {
    vi.mocked(autoPlace).mockRejectedValue(new Error('no nodes'));
    renderWithClient(<CreateForm />);

    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(await screen.findByPlaceholderText('Please input size'), { target: { value: '1' } });
    submit();

    await waitFor(() => expect(deleteResourceDefinition).toHaveBeenCalledWith('rd9'));
    expect(
      await screen.findByText(
        'rd9 could not be created and placed, so the new resource definition was removed again. Adjust the form and submit again.',
      ),
    ).toBeInTheDocument();
    expect(hoisted.navigate).not.toHaveBeenCalled();
    // What was entered is still there for the retry.
    expect(nameInput()).toHaveValue('rd9');
  });

  it('stops after a failed definition create', async () => {
    vi.mocked(createResourceDefinition).mockResolvedValue(failed as never);
    renderWithClient(<CreateForm />);

    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(await screen.findByPlaceholderText('Please input size'), { target: { value: '1' } });
    submit();

    await waitFor(() => expect(createResourceDefinition).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(createVolumeDefinition).not.toHaveBeenCalled();
    // Nothing was created, so nothing is removed.
    expect(deleteResourceDefinition).not.toHaveBeenCalled();
    expect(hoisted.navigate).not.toHaveBeenCalled();
  });

  it('removes the new definition after a failed volume create', async () => {
    vi.mocked(createVolumeDefinition).mockResolvedValue(failed as never);
    renderWithClient(<CreateForm />);

    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(await screen.findByPlaceholderText('Please input size'), { target: { value: '1' } });
    submit();

    await waitFor(() => expect(deleteResourceDefinition).toHaveBeenCalledWith('rd9'));
    expect(autoPlace).not.toHaveBeenCalled();
    expect(hoisted.navigate).not.toHaveBeenCalled();
  });

  it('keeps submit disabled until the groups and pools are loaded', () => {
    hoisted.groups = { isLoading: true, data: undefined };
    renderWithClient(<CreateForm />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('goes back on cancel', () => {
    renderWithClient(<CreateForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(hoisted.navigate).toHaveBeenCalledWith(-1);
  });

  it('updates the group of an existing definition in edit mode', async () => {
    renderWithClient(<CreateForm isEdit initialValues={{ name: 'rd1', resource_group_name: 'rg1' }} />);

    expect(nameInput()).toBeDisabled();
    expect(nameInput()).toHaveValue('rd1');
    expect(screen.getByLabelText('Asynchronous(A)')).toBeDisabled();
    expect(screen.getByLabelText('Synchronous(C)')).toBeDisabled();
    expect(screen.queryByRole('switch')).toBeNull();

    await selectOption(screen.getByRole('combobox'), 'DfltRscGrp');
    submit();

    await waitFor(() => expect(updateResourceDefinition).toHaveBeenCalledWith('rd1', { resource_group: 'DfltRscGrp' }));
    expect(createResourceDefinition).not.toHaveBeenCalled();
    await waitFor(() => expect(hoisted.navigate).toHaveBeenCalledWith(-1));
  });

  it('stays on the edit form when the controller rejects the change', async () => {
    vi.mocked(updateResourceDefinition).mockResolvedValue(failed as never);
    renderWithClient(<CreateForm isEdit initialValues={{ name: 'rd1', resource_group_name: 'rg1' }} />);

    submit();

    await waitFor(() => expect(updateResourceDefinition).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(hoisted.navigate).not.toHaveBeenCalled();
  });

  it('leaves the edit form when the group moved but placing its replicas failed', async () => {
    // The controller commits the new group before it places the replicas the
    // group asks for; the placement error does not undo the move.
    vi.mocked(updateResourceDefinition).mockResolvedValue({
      data: [
        { ret_code: 0x2380003, message: "Resource definition 'rd1' modified." },
        { ret_code: -4611686018407202813, message: "No volumes have been defined for resource 'rd1'" },
      ],
    } as never);
    renderWithClient(<CreateForm isEdit initialValues={{ name: 'rd1', resource_group_name: 'rg1' }} />);

    submit();

    await waitFor(() => expect(hoisted.navigate).toHaveBeenCalledWith(-1));
  });

  it('leaves the edit form when an error status still reports the definition modified', async () => {
    vi.mocked(updateResourceDefinition).mockResolvedValue({
      error: [
        { ret_code: 0x2380003, message: "Resource definition 'rd1' modified." },
        { ret_code: -1, message: 'Not enough available nodes' },
      ],
    } as never);
    renderWithClient(<CreateForm isEdit initialValues={{ name: 'rd1', resource_group_name: 'rg1' }} />);

    submit();

    await waitFor(() => expect(hoisted.navigate).toHaveBeenCalledWith(-1));
  });

  it('stays on the edit form when the request itself fails', async () => {
    vi.mocked(updateResourceDefinition).mockRejectedValue(new Error('Failed to fetch'));
    renderWithClient(<CreateForm isEdit initialValues={{ name: 'rd1', resource_group_name: 'rg1' }} />);

    submit();

    await waitFor(() => expect(updateResourceDefinition).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(hoisted.navigate).not.toHaveBeenCalled();
  });

  it('removes the new definition when the controller answers the placement with an error', async () => {
    vi.mocked(autoPlace).mockResolvedValue(failed as never);
    renderWithClient(<CreateForm />);

    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(await screen.findByPlaceholderText('Please input size'), { target: { value: '1' } });
    submit();

    await waitFor(() => expect(deleteResourceDefinition).toHaveBeenCalledWith('rd9'));
    expect(hoisted.navigate).not.toHaveBeenCalled();
  });

  it('stays on the form without the notice when removing the definition fails too', async () => {
    vi.mocked(autoPlace).mockResolvedValue(failed as never);
    vi.mocked(deleteResourceDefinition).mockResolvedValue(failed as never);
    renderWithClient(<CreateForm />);

    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(await screen.findByPlaceholderText('Please input size'), { target: { value: '1' } });
    submit();

    await waitFor(() => expect(deleteResourceDefinition).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText(/was removed again/)).toBeNull();
    expect(hoisted.navigate).not.toHaveBeenCalled();
  });

  it('limits the place count to the nodes with a storage pool the group can use', async () => {
    hoisted.groups = {
      isLoading: false,
      data: [{ name: 'DfltRscGrp' }, { name: 'rg1', select_filter: { storage_pool: 'sp1' } }],
    };
    renderWithClient(<CreateForm />);

    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(await screen.findByPlaceholderText('Please input size'), { target: { value: '1' } });
    const placeCount = screen.getByRole('spinbutton', { name: 'Place Count' });

    // n1-n3 have diskful pools; the diskless pool on n4 does not count.
    fireEvent.change(placeCount, { target: { value: '4' } });
    submit();
    expect(
      await screen.findByText('Only 3 nodes have a storage pool this resource group can place on'),
    ).toBeInTheDocument();

    fireEvent.change(placeCount, { target: { value: '0' } });
    expect(await screen.findByText('Place count must be at least 1')).toBeInTheDocument();

    // rg1 places on sp1 only, which two nodes have.
    await selectOption(screen.getAllByRole('combobox')[0], 'rg1');
    fireEvent.change(placeCount, { target: { value: '3' } });
    submit();
    expect(
      await screen.findByText('Only 2 nodes have a storage pool this resource group can place on'),
    ).toBeInTheDocument();
    expect(createResourceDefinition).not.toHaveBeenCalled();
  });

  it('places without a volume when the size is zero', async () => {
    renderWithClient(<CreateForm />);

    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(await screen.findByPlaceholderText('Please input size'), { target: { value: '0' } });
    submit();

    await waitFor(() =>
      expect(autoPlace).toHaveBeenCalledWith('rd9', {
        diskless_on_remaining: undefined,
        select_filter: { place_count: 2 },
      }),
    );
    expect(createVolumeDefinition).not.toHaveBeenCalled();
    await waitFor(() => expect(hoisted.navigate).toHaveBeenCalledWith(-1));
  });
});
