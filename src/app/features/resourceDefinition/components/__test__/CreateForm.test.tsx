// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import { CreateForm } from '../CreateForm';
import { createResourceDefinition, createVolumeDefinition, autoPlace, updateResourceDefinition } from '../../api';
import { renderWithClient, selectOption, ok, failed } from './helpers';

vi.mock('../../api', () => ({
  createResourceDefinition: vi.fn(),
  createVolumeDefinition: vi.fn(),
  autoPlace: vi.fn(),
  updateResourceDefinition: vi.fn(),
}));

const hoisted = vi.hoisted(() => ({
  navigate: vi.fn(),
  groups: { isLoading: false, data: [{ name: 'DfltRscGrp' }, { name: 'rg1' }] as unknown },
  pools: { isLoading: false, data: [{ storage_pool_name: 'sp1' }] as unknown },
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
    hoisted.pools = { isLoading: false, data: [{ storage_pool_name: 'sp1' }] };
    vi.mocked(createResourceDefinition).mockResolvedValue(ok as never);
    vi.mocked(createVolumeDefinition).mockResolvedValue(ok as never);
    vi.mocked(autoPlace).mockResolvedValue(ok as never);
    vi.mocked(updateResourceDefinition).mockResolvedValue(ok as never);
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

    expect(screen.getByRole('switch')).not.toBeChecked();
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
    submit();
    expect(await screen.findByText('Size is required when spawn-on-create is enabled!')).toBeInTheDocument();
    expect(createResourceDefinition).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('Please input size'), { target: { value: '1' } });
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

  it('still leaves the page when the placement fails', async () => {
    vi.mocked(autoPlace).mockRejectedValue(new Error('no nodes'));
    renderWithClient(<CreateForm />);

    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(screen.getByPlaceholderText('Please input size'), { target: { value: '1' } });
    submit();

    await waitFor(() => expect(autoPlace).toHaveBeenCalled());
    await waitFor(() => expect(hoisted.navigate).toHaveBeenCalledWith(-1));
  });

  it('stops after a failed definition create', async () => {
    vi.mocked(createResourceDefinition).mockResolvedValue(failed as never);
    renderWithClient(<CreateForm />);

    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(screen.getByPlaceholderText('Please input size'), { target: { value: '1' } });
    submit();

    await waitFor(() => expect(createResourceDefinition).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(createVolumeDefinition).not.toHaveBeenCalled();
    expect(hoisted.navigate).not.toHaveBeenCalled();
  });

  it('stops after a failed volume create', async () => {
    vi.mocked(createVolumeDefinition).mockResolvedValue(failed as never);
    renderWithClient(<CreateForm />);

    fireEvent.change(nameInput(), { target: { value: 'rd9' } });
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(screen.getByPlaceholderText('Please input size'), { target: { value: '1' } });
    submit();

    await waitFor(() => expect(createVolumeDefinition).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
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
    expect(screen.queryByRole('switch')).toBeNull();

    await selectOption(screen.getByRole('combobox'), 'DfltRscGrp');
    submit();

    await waitFor(() => expect(updateResourceDefinition).toHaveBeenCalledWith('rd1', { resource_group: 'DfltRscGrp' }));
    expect(createResourceDefinition).not.toHaveBeenCalled();
    await waitFor(() => expect(hoisted.navigate).toHaveBeenCalledWith(-1));
  });
});
