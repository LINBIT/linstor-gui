// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { forwardRef, useImperativeHandle, useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The page renders real antd (Table, Dropdown, Form) on top of a real
// react-query client; only the transport, the router's navigate and the redux
// UI mode are replaced. That way the tests exercise the column renderers, the
// dropdown actions and the confirm flows the way a user hits them.

vi.mock('../../api', () => ({
  getResourceGroups: vi.fn(),
  getResourceGroupCount: vi.fn(),
  getResourceGroupVolumeGroups: vi.fn(),
  deleteResourceGroup: vi.fn(),
  updateResourceGroup: vi.fn(),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

let uiMode = 'NORMAL';
vi.mock('react-redux', () => ({
  useSelector: (selector: (s: unknown) => unknown) => selector({ setting: { mode: uiMode } }),
}));

vi.mock('@app/models/setting', () => ({
  UIMode: { NORMAL: 'NORMAL', VSAN: 'VSAN', HCI: 'HCI' },
}));

// PropertyForm is a large modal of its own; here it only needs to open on
// demand and hand a payload back through handleSubmit.
vi.mock('@app/components/PropertyForm', () => ({
  default: forwardRef(function PropertyFormMock(
    { handleSubmit, initialVal }: { handleSubmit: (d: unknown) => void; initialVal?: Record<string, unknown> },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    useImperativeHandle(ref, () => ({ openModal: () => setOpen(true) }));
    return open ? (
      <button data-testid="property-form-submit" onClick={() => handleSubmit({ override_props: initialVal })}>
        property-form
      </button>
    ) : null;
  }),
}));

import {
  getResourceGroups,
  getResourceGroupCount,
  getResourceGroupVolumeGroups,
  deleteResourceGroup,
  updateResourceGroup,
} from '../../api';
import { List } from '../List';

const groups = [
  {
    name: 'rg-alpha',
    select_filter: {
      place_count: 2,
      storage_pool_list: ['pool-a', 'pool-b'],
      layer_stack: ['DRBD', 'STORAGE'],
      replicas_on_different: [],
      not_place_with_rsc_regex: '',
    },
    props: { 'DrbdOptions/Net/protocol': 'C', 'Aux/team': 'storage' },
  },
  {
    name: 'rg-beta',
    select_filter: { place_count: 3 },
    props: {},
  },
];

const volumeGroupsByName: Record<string, { volume_number: number }[]> = {
  'rg-alpha': [{ volume_number: 1 }, { volume_number: 0 }],
  'rg-beta': [],
};

const renderList = (initialEntry = '/storage-configuration/resource-groups') => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <List />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

// Opens the row's "..." dropdown and returns the menu item with the given text.
const openRowMenu = async (rowName: string) => {
  const row = screen.getByText(rowName).closest('tr') as HTMLElement;
  fireEvent.mouseEnter(within(row).getByRole('img', { name: 'more' }));
  return await screen.findByRole('menu');
};

describe('resource group List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMode = 'NORMAL';
    vi.mocked(getResourceGroups).mockResolvedValue({ data: groups } as never);
    vi.mocked(getResourceGroupCount).mockResolvedValue({ data: { count: 42 } } as never);
    vi.mocked(getResourceGroupVolumeGroups).mockImplementation(
      async (name: string) => ({ data: volumeGroupsByName[name] ?? [] }) as never,
    );
    vi.mocked(deleteResourceGroup).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    vi.mocked(updateResourceGroup).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('lists the groups with place count and the total from the stats endpoint', async () => {
    renderList();
    const alpha = (await screen.findByText('rg-alpha')).closest('tr') as HTMLElement;
    const beta = screen.getByText('rg-beta').closest('tr') as HTMLElement;
    expect(within(alpha).getByText('2')).toBeInTheDocument();
    expect(within(beta).getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total 42 items')).toBeInTheDocument();
    expect(getResourceGroups).toHaveBeenCalledWith({ limit: 10, offset: 0, resource_groups: undefined });
  });

  it('renders the select filter, linking storage pools and skipping empty entries', async () => {
    renderList();
    const row = (await screen.findByText('rg-alpha')).closest('tr') as HTMLElement;

    const poolLink = within(row).getByText('pool-a, pool-b').closest('a');
    expect(poolLink).toHaveAttribute('href', '/inventory/storage-pools?storage_pools=pool-a,pool-b');
    expect(within(row).getByText(/layer_stack:/)).toHaveTextContent('layer_stack: DRBD, STORAGE');
    // place_count has its own column; empty arrays and strings are noise.
    expect(within(row).queryByText(/place_count:/)).not.toBeInTheDocument();
    expect(within(row).queryByText(/replicas_on_different/)).not.toBeInTheDocument();
    expect(within(row).queryByText(/not_place_with_rsc_regex/)).not.toBeInTheDocument();
  });

  it('shows volume numbers sorted, and a dash for a group without volume groups', async () => {
    renderList();
    await screen.findByText('rg-alpha');
    expect(await screen.findByText('0, 1')).toBeInTheDocument();
    const beta = screen.getByText('rg-beta').closest('tr') as HTMLElement;
    expect(within(beta).getByText('-')).toBeInTheDocument();
    expect(getResourceGroupVolumeGroups).toHaveBeenCalledWith('rg-alpha');
    expect(getResourceGroupVolumeGroups).toHaveBeenCalledWith('rg-beta');
  });

  it('renders properties as tags', async () => {
    renderList();
    await screen.findByText('rg-alpha');
    expect(screen.getByText('DrbdOptions/Net/protocol: C')).toBeInTheDocument();
    expect(screen.getByText('Aux/team: storage')).toBeInTheDocument();
  });

  it('links "+ Add" to the create page', async () => {
    renderList();
    expect((await screen.findByText('+ Add')).closest('a')).toHaveAttribute(
      'href',
      '/storage-configuration/resource-groups/create',
    );
  });

  it('links "+ Add" under /hci in HCI mode', async () => {
    uiMode = 'HCI';
    renderList();
    expect((await screen.findByText('+ Add')).closest('a')).toHaveAttribute(
      'href',
      '/hci/storage-configuration/resource-groups/create',
    );
  });

  it('searches by name: filters the query and writes it to the URL', async () => {
    renderList();
    await screen.findByText('rg-alpha');

    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'rg-b' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() =>
      expect(getResourceGroups).toHaveBeenLastCalledWith(expect.objectContaining({ resource_groups: ['rg-b'] })),
    );
    expect(navigate).toHaveBeenCalledWith('/storage-configuration/resource-groups?resource_groups=rg-b');
  });

  it('seeds the filter from ?resource_groups= in the URL', async () => {
    renderList('/storage-configuration/resource-groups?resource_groups=rg-alpha,rg-beta');
    await screen.findByText('rg-alpha');
    expect(getResourceGroups).toHaveBeenCalledWith(
      expect.objectContaining({ resource_groups: ['rg-alpha', 'rg-beta'] }),
    );
  });

  it('reset clears the query and returns to the list route of the current mode', async () => {
    renderList();
    await screen.findByText('rg-alpha');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(getResourceGroups).toHaveBeenLastCalledWith({}));
    expect(navigate).toHaveBeenCalledWith('/storage-configuration/resource-groups');
  });

  it('navigates to the edit page from the row menu', async () => {
    renderList();
    await screen.findByText('rg-alpha');
    const menu = await openRowMenu('rg-alpha');
    fireEvent.click(within(menu).getByText('Edit'));
    expect(navigate).toHaveBeenCalledWith('/storage-configuration/resource-groups/rg-alpha/edit');
  });

  it('deletes a group only after the confirm, then refetches', async () => {
    renderList();
    await screen.findByText('rg-alpha');
    const menu = await openRowMenu('rg-alpha');

    fireEvent.click(within(menu).getByText('Delete'));
    expect(await screen.findByText('Are you sure to delete this resource group?')).toBeInTheDocument();
    expect(deleteResourceGroup).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(deleteResourceGroup).toHaveBeenCalledWith('rg-alpha'));
    await waitFor(() => expect(getResourceGroups).toHaveBeenCalledTimes(2));
  });

  it('bulk delete is disabled until a row is selected, then deletes each selected group', async () => {
    renderList();
    await screen.findByText('rg-alpha');

    const bulkDelete = screen.getByRole('button', { name: 'Delete' });
    expect(bulkDelete).toBeDisabled();

    const [, alphaBox, betaBox] = screen.getAllByRole('checkbox');
    fireEvent.click(alphaBox);
    fireEvent.click(betaBox);
    expect(bulkDelete).toBeEnabled();

    fireEvent.click(bulkDelete);
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));

    await waitFor(() => expect(deleteResourceGroup).toHaveBeenCalledTimes(2));
    expect(deleteResourceGroup).toHaveBeenCalledWith('rg-alpha');
    expect(deleteResourceGroup).toHaveBeenCalledWith('rg-beta');
  });

  it('opens the property form for the row and submits the change to that group', async () => {
    renderList();
    await screen.findByText('rg-alpha');
    const menu = await openRowMenu('rg-alpha');
    fireEvent.click(within(menu).getByText('Properties'));

    fireEvent.click(await screen.findByTestId('property-form-submit'));
    await waitFor(() =>
      expect(updateResourceGroup).toHaveBeenCalledWith('rg-alpha', {
        override_props: { 'DrbdOptions/Net/protocol': 'C', 'Aux/team': 'storage' },
      }),
    );
  });

  it('shows an empty table when the api returns nothing', async () => {
    vi.mocked(getResourceGroups).mockResolvedValue({ data: [] } as never);
    vi.mocked(getResourceGroupCount).mockResolvedValue({ data: { count: 0 } } as never);
    renderList();
    expect((await screen.findAllByText('No data')).length).toBeGreaterThan(0);
    expect(screen.queryByText('rg-alpha')).not.toBeInTheDocument();
  });
});
