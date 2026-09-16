// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { forwardRef, useImperativeHandle, useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { message } from 'antd';

import { List } from '../List';
import {
  getResourceDefinition,
  getResourceDefinitionCount,
  deleteResourceDefinition,
  updateResourceDefinition,
  autoPlace,
  getVolumeDefinitionListByResource,
  updateVolumeDefinition,
} from '../../api';
import { renderWithClient, confirmPopover, openRowMenu, expectModalClosed, tableRows, rowByText, ok } from './helpers';

vi.mock('../../api', () => ({
  getResourceDefinition: vi.fn(),
  getResourceDefinitionCount: vi.fn(),
  deleteResourceDefinition: vi.fn(),
  updateResourceDefinition: vi.fn(),
  autoPlace: vi.fn(),
  getVolumeDefinitionListByResource: vi.fn(),
  updateVolumeDefinition: vi.fn(),
}));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

vi.mock('@app/components/PropertyForm', () => ({
  default: forwardRef(function PropertyFormMock(
    { handleSubmit, initialVal }: { handleSubmit: (d: unknown) => void; initialVal?: Record<string, unknown> },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    useImperativeHandle(ref, () => ({ openModal: () => setOpen(true), closeModal: () => setOpen(false) }));
    return open ? (
      <button data-testid="property-form-submit" onClick={() => handleSubmit({ override_props: initialVal })}>
        {JSON.stringify(initialVal)}
      </button>
    ) : null;
  }),
}));

const definitions = [
  {
    name: 'rd1',
    uuid: 'u1',
    resource_group_name: 'rg1',
    layer_data: [{ type: 'DRBD', data: { port: 7000 } }],
    flags: [],
    props: { DrbdPrimarySetOn: 'n1', 'NVMe/TRType': 'tcp', 'Aux/owner': 'team-a' },
  },
  { name: 'rd2', uuid: 'u2', resource_group_name: 'rg2', layer_data: [], flags: ['DELETE'], props: {} },
];

const renderList = async (path = '/storage-configuration/resource-definitions') => {
  const utils = renderWithClient(<List />, path);
  await waitFor(() => expect(tableRows(utils.container)).toHaveLength(2));
  return utils;
};

describe('resourceDefinition List', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getResourceDefinition).mockResolvedValue({ data: definitions } as never);
    vi.mocked(getResourceDefinitionCount).mockResolvedValue({ data: { count: 2 } } as never);
    vi.mocked(deleteResourceDefinition).mockResolvedValue(ok as never);
    vi.mocked(updateResourceDefinition).mockResolvedValue(ok as never);
    vi.mocked(autoPlace).mockResolvedValue(ok as never);
    vi.mocked(getVolumeDefinitionListByResource).mockResolvedValue({
      data: [{ volume_number: 0, size_kib: 1024 * 1024 }],
    } as never);
    vi.mocked(updateVolumeDefinition).mockResolvedValue(ok as never);
  });

  afterEach(() => {
    message.destroy();
  });

  it('lists the definitions with group, port and state', async () => {
    const { container } = await renderList();

    const rd1 = rowByText(container, 'rd1');
    expect(rd1).toHaveTextContent('rg1');
    expect(rd1).toHaveTextContent('7000');
    expect(within(rd1).getByText('OK')).toHaveClass('ant-tag');
    const rd2 = rowByText(container, 'rd2');
    expect(within(rd2).getByText('DELETING')).toHaveClass('ant-tag');
    expect(screen.getByText('Total 2 items')).toBeInTheDocument();
    expect(getResourceDefinition).toHaveBeenCalledWith({ limit: 10, offset: 0, resource_definitions: undefined });

    fireEvent.click(within(rd1).getByRole('button', { name: 'rg1' }));
    expect(navigate).toHaveBeenCalledWith('/storage-configuration/resource-groups?resource_groups=rg1');
  });

  it('seeds the filter from the URL', async () => {
    await renderList('/storage-configuration/resource-definitions?resource_definitions=rd1,rd2');

    expect(getResourceDefinition).toHaveBeenCalledWith({ limit: 10, offset: 0, resource_definitions: ['rd1', 'rd2'] });
    expect(screen.getByPlaceholderText('Resource Definition Name')).toHaveValue('rd1,rd2');
  });

  it('searches by name, writes the URL and resets again', async () => {
    await renderList();

    fireEvent.change(screen.getByPlaceholderText('Resource Definition Name'), { target: { value: 'rd1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() =>
      expect(getResourceDefinition).toHaveBeenLastCalledWith({ limit: 10, offset: 0, resource_definitions: ['rd1'] }),
    );
    expect(navigate).toHaveBeenCalledWith('/storage-configuration/resource-definitions?resource_definitions=rd1');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(getResourceDefinition).toHaveBeenLastCalledWith({}));
    expect(navigate).toHaveBeenCalledWith('/storage-configuration/resource-definitions');
    expect(screen.getByPlaceholderText('Resource Definition Name')).toHaveValue('');
  });

  it('navigates to the create page', async () => {
    await renderList();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(navigate).toHaveBeenCalledWith('/storage-configuration/resource-definitions/create');
  });

  it('deletes one definition after confirmation and reloads', async () => {
    const { container } = await renderList();

    fireEvent.click(within(rowByText(container, 'rd1')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Are you sure to delete this resource definition?')).toBeInTheDocument();
    await confirmPopover();

    await waitFor(() => expect(deleteResourceDefinition).toHaveBeenCalledWith('rd1'));
    await waitFor(() => expect(getResourceDefinition).toHaveBeenCalledTimes(2));
  });

  it('deletes the selected definitions in bulk', async () => {
    const { container } = await renderList();

    expect(screen.queryByText('Are you sure to delete selected resource definitions?')).toBeNull();
    fireEvent.click(within(rowByText(container, 'rd1')).getByRole('checkbox'));
    fireEvent.click(within(rowByText(container, 'rd2')).getByRole('checkbox'));

    const bulk = within(container.querySelector('form') as HTMLElement).getByRole('button', { name: 'Delete' });
    fireEvent.click(bulk);
    expect(await screen.findByText('Are you sure to delete selected resource definitions?')).toBeInTheDocument();
    await confirmPopover();

    await waitFor(() => expect(deleteResourceDefinition).toHaveBeenCalledTimes(2));
    expect(deleteResourceDefinition).toHaveBeenCalledWith('rd1');
    expect(deleteResourceDefinition).toHaveBeenCalledWith('rd2');
  });

  it('spawns a definition with the entered placement', async () => {
    const { container } = await renderList();

    fireEvent.click(within(rowByText(container, 'rd1')).getByRole('button', { name: 'Spawn' }));
    const dialog = await screen.findByRole('dialog');
    const placeCount = within(dialog).getByRole('spinbutton') as HTMLInputElement;
    expect(placeCount.value).toBe('1');
    fireEvent.change(placeCount, { target: { value: '3' } });
    fireEvent.click(within(dialog).getByRole('checkbox'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Spawn' }));

    await waitFor(() =>
      expect(autoPlace).toHaveBeenCalledWith('rd1', {
        diskless_on_remaining: true,
        select_filter: { place_count: 3 },
      }),
    );
    await expectModalClosed();
  });

  it('opens edit, resize and properties from the row menu', async () => {
    const { container } = await renderList();
    const rd1 = rowByText(container, 'rd1');

    let menu = await openRowMenu(rd1);
    fireEvent.click(within(menu).getByText('Edit'));
    expect(navigate).toHaveBeenCalledWith('/storage-configuration/resource-definitions/rd1/edit');

    menu = await openRowMenu(rd1);
    fireEvent.click(within(menu).getByText('Properties'));
    const propertyForm = await screen.findByTestId('property-form-submit');
    expect(propertyForm).toHaveTextContent('{"Aux/owner":"team-a"}');
    fireEvent.click(propertyForm);
    await waitFor(() =>
      expect(updateResourceDefinition).toHaveBeenCalledWith('rd1', { override_props: { 'Aux/owner': 'team-a' } }),
    );
    await waitFor(() => expect(getResourceDefinition).toHaveBeenCalledTimes(2));

    menu = await openRowMenu(rd1);
    fireEvent.click(within(menu).getByText('Resize'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Resize rd1');
    await waitFor(() => expect(getVolumeDefinitionListByResource).toHaveBeenCalledWith('rd1'));
    const size = await within(dialog).findByRole('spinbutton');
    expect((size as HTMLInputElement).value).toBe('1');
    fireEvent.change(size, { target: { value: '2' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(updateVolumeDefinition).toHaveBeenCalledWith('rd1', 0, { size_kib: 2 * 1024 * 1024 }));
    expect(await screen.findByText('Operation Successful')).toBeInTheDocument();
    await waitFor(() => expect(getResourceDefinition).toHaveBeenCalledTimes(3));
  });

  it('pages through the list', async () => {
    vi.mocked(getResourceDefinitionCount).mockResolvedValue({ data: { count: 25 } } as never);
    await renderList();

    fireEvent.click(await screen.findByTitle('2'));
    await waitFor(() =>
      expect(getResourceDefinition).toHaveBeenLastCalledWith({
        limit: 10,
        offset: 10,
        resource_definitions: undefined,
      }),
    );
  });
});
