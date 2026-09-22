// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { List } from '../List';
import { getNodes, getNodeCount, deleteNode, lostNode, updateNode, getControllerVersion } from '../../api';
import { UIMode } from '@app/models/setting';

const hoisted = vi.hoisted(() => ({
  navigate: vi.fn(),
  mode: { value: 'NORMAL' as string },
  propertyForm: { open: vi.fn(), submit: undefined as ((data: unknown) => void) | undefined },
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => hoisted.navigate,
}));

vi.mock('react-redux', () => ({
  useSelector: (selector: (s: unknown) => unknown) => selector({ setting: { mode: hoisted.mode.value } }),
}));

vi.mock('../../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api')>()),
  getNodes: vi.fn(),
  getNodeCount: vi.fn(),
  deleteNode: vi.fn(),
  lostNode: vi.fn(),
  updateNode: vi.fn(),
  getControllerVersion: vi.fn(),
}));

// The property editor has its own suite; here it only has to expose the
// imperative handle the list drives and the payload it submits.
vi.mock('@app/components/PropertyForm', async () => {
  const react = await import('react');
  return {
    default: react.forwardRef(
      (
        { initialVal, handleSubmit }: { initialVal?: Record<string, unknown>; handleSubmit: (d: unknown) => void },
        ref,
      ) => {
        react.useImperativeHandle(ref, () => ({ openModal: hoisted.propertyForm.open }));
        hoisted.propertyForm.submit = handleSubmit;
        return <div data-testid="property-form" data-initial={JSON.stringify(initialVal ?? null)} />;
      },
    ),
  };
});

const nodes = [
  {
    uuid: 'u1',
    name: 'gui01',
    type: 'SATELLITE',
    platform: 'LINUX',
    os_variant: 'Ubuntu',
    connection_status: 'ONLINE',
    net_interfaces: [
      { name: 'backup', address: '10.0.1.1', satellite_port: 3367, is_active: false },
      { name: 'default', address: '10.0.0.1', satellite_port: 3366, is_active: true },
    ],
    props: { 'Aux/owner': 'team-a', CurStltConnName: 'default' },
  },
  {
    uuid: 'u2',
    name: 'gui02',
    type: 'COMBINED',
    platform: 'WINDOWS',
    os_variant: 'Server 2022',
    connection_status: 'OFFLINE',
    net_interfaces: [{ name: 'default', address: '10.0.0.2', satellite_port: 3366, is_active: true }],
    props: {},
  },
];

const renderList = (search = '') => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/inventory/nodes${search}`]}>
        <List />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const rows = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.ant-table-tbody tr.ant-table-row')) as HTMLElement[];

const rowOf = (container: HTMLElement, name: string) => {
  const row = rows(container).find((tr) => tr.textContent?.includes(name));
  expect(row).toBeDefined();
  return row as HTMLElement;
};

const selectRow = (container: HTMLElement, name: string) =>
  fireEvent.click(within(rowOf(container, name)).getByRole('checkbox'));

/** Open the per-row action dropdown and return its (portalled) menu. */
const openRowMenu = async (container: HTMLElement, name: string) => {
  fireEvent.mouseEnter(within(rowOf(container, name)).getByRole('button'));
  fireEvent.click(within(rowOf(container, name)).getByRole('button'));
  return waitFor(() => {
    const menus = Array.from(document.querySelectorAll('.ant-dropdown:not(.ant-dropdown-hidden) ul.ant-dropdown-menu'));
    expect(menus.length).toBeGreaterThan(0);
    return menus[menus.length - 1] as HTMLElement;
  });
};

const confirmPopconfirm = async () => {
  const yes = await screen.findAllByRole('button', { name: 'Yes' });
  fireEvent.click(yes[yes.length - 1]);
};

describe('node List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.mode.value = UIMode.NORMAL;
    vi.mocked(getNodes).mockResolvedValue({ data: nodes } as never);
    vi.mocked(getNodeCount).mockResolvedValue({ data: { count: 2 } } as never);
    vi.mocked(getControllerVersion).mockResolvedValue({ data: { rest_api_version: '1.28.0' } } as never);
    vi.mocked(deleteNode).mockResolvedValue({ data: [] } as never);
    vi.mocked(lostNode).mockResolvedValue({ data: [] } as never);
    vi.mocked(updateNode).mockResolvedValue({ data: [] } as never);
  });

  it('asks for the first page and lists what comes back', async () => {
    const { container } = renderList();

    await waitFor(() => expect(rows(container)).toHaveLength(2));
    expect(getNodes).toHaveBeenCalledWith({ limit: 10, offset: 0, nodes: undefined });

    const first = rowOf(container, 'gui01');
    // The address and port come from the ACTIVE interface, not the first one.
    expect(first).toHaveTextContent('10.0.0.1');
    expect(first).toHaveTextContent('3366');
    expect(first).toHaveTextContent('ONLINE');
    expect(within(first).getByRole('link', { name: 'gui01' })).toHaveAttribute('href', '/inventory/nodes/gui01');
  });

  it('links into the HCI node pages in HCI mode', async () => {
    hoisted.mode.value = UIMode.HCI;
    const { container } = renderList();

    await waitFor(() => expect(rows(container)).toHaveLength(2));
    expect(within(rowOf(container, 'gui01')).getByRole('link', { name: 'gui01' })).toHaveAttribute(
      'href',
      '/hci/inventory/nodes/gui01',
    );
    expect(screen.getByRole('link', { name: /Add/ })).toHaveAttribute('href', '/hci/inventory/nodes/create');
  });

  it('shows the platform column only on a controller new enough to report it', async () => {
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    expect(screen.getByRole('columnheader', { name: 'Platform' })).toBeInTheDocument();
    expect(rowOf(container, 'gui01')).toHaveTextContent('LINUX');
    expect(rowOf(container, 'gui02')).toHaveTextContent('WINDOWS');
  });

  it('prints an unrecognised platform as-is', async () => {
    vi.mocked(getNodes).mockResolvedValue({
      data: [{ ...nodes[0], platform: 'FREEBSD' }],
    } as never);
    const { container } = renderList();

    await waitFor(() => expect(rows(container)).toHaveLength(1));
    expect(rowOf(container, 'gui01')).toHaveTextContent('FREEBSD');
  });

  it('sorts by name, tolerating a node the controller did not name', async () => {
    vi.mocked(getNodes).mockResolvedValue({
      data: [nodes[1], nodes[0], { ...nodes[0], uuid: 'u3', name: undefined }],
    } as never);
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(3));

    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() => {
      const names = rows(container).map((tr) => tr.querySelector('a')?.textContent ?? '');
      expect(names.slice(0, 2)).toEqual(['gui01', 'gui02']);
    });

    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() => {
      const names = rows(container)
        .map((tr) => tr.querySelector('a')?.textContent ?? '')
        .filter(Boolean);
      expect(names).toEqual(['gui02', 'gui01']);
    });
  });

  it('drops the platform column on a controller older than 1.28.0', async () => {
    vi.mocked(getControllerVersion).mockResolvedValue({ data: { rest_api_version: '1.27.9' } } as never);
    const { container } = renderList();

    await waitFor(() => expect(rows(container)).toHaveLength(2));
    await waitFor(() => expect(screen.queryByRole('columnheader', { name: 'Platform' })).toBeNull());
  });

  it('seeds the filter from the URL', async () => {
    renderList('?nodes=gui01');

    await waitFor(() => expect(getNodes).toHaveBeenCalledWith({ limit: 10, offset: 0, nodes: ['gui01'] }));
    expect(screen.getByPlaceholderText('Name')).toHaveValue('gui01');
  });

  it('searches by name and puts the filter in the URL', async () => {
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'gui02' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => expect(getNodes).toHaveBeenCalledWith({ limit: 10, offset: 0, nodes: ['gui02'] }));
    expect(hoisted.navigate).toHaveBeenCalledWith('/inventory/nodes?nodes=gui02');
  });

  it('clears the filter and the URL on reset', async () => {
    const { container } = renderList('?nodes=gui01');
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    await waitFor(() => expect(getNodes).toHaveBeenLastCalledWith({}));
    expect(hoisted.navigate).toHaveBeenCalledWith('/inventory/nodes');
  });

  it('turns a page into an offset and keeps the pager on that page', async () => {
    vi.mocked(getNodeCount).mockResolvedValue({ data: { count: 25 } } as never);
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    fireEvent.click(screen.getByRole('listitem', { name: '2' }));

    await waitFor(() => expect(getNodes).toHaveBeenLastCalledWith({ limit: 10, offset: 10, nodes: undefined }));
    // offset counts items, so the pager has to divide by the page size.
    expect(container.querySelector('.ant-pagination-item-active')?.textContent).toBe('2');
  });

  it('keeps the bulk actions disabled until rows are selected', async () => {
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Lost' })).toBeDisabled();
  });

  it('only offers Lost when every selected node is offline', async () => {
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    selectRow(container, 'gui02');
    expect(screen.getByRole('button', { name: 'Lost' })).toBeEnabled();

    // gui01 is ONLINE, so the pair cannot be lost.
    selectRow(container, 'gui01');
    expect(screen.getByRole('button', { name: 'Lost' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
  });

  it('deletes every selected node and drops the selection', async () => {
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    selectRow(container, 'gui01');
    selectRow(container, 'gui02');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await confirmPopconfirm();

    await waitFor(() => expect(deleteNode).toHaveBeenCalledTimes(2));
    expect(deleteNode).toHaveBeenCalledWith('gui01');
    expect(deleteNode).toHaveBeenCalledWith('gui02');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled());
  });

  it('loses the selected offline node', async () => {
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    selectRow(container, 'gui02');
    fireEvent.click(screen.getByRole('button', { name: 'Lost' }));
    await confirmPopconfirm();

    await waitFor(() => expect(lostNode).toHaveBeenCalledWith('gui02'));
    expect(deleteNode).not.toHaveBeenCalled();
  });

  it('navigates from the row menu to the detail and edit pages', async () => {
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    let menu = await openRowMenu(container, 'gui01');
    fireEvent.click(within(menu).getByText('View'));
    expect(hoisted.navigate).toHaveBeenCalledWith('/inventory/nodes/gui01');

    menu = await openRowMenu(container, 'gui01');
    fireEvent.click(within(menu).getByText('Edit'));
    expect(hoisted.navigate).toHaveBeenCalledWith('/inventory/nodes/edit/gui01');
  });

  it('deletes a single node from its row menu', async () => {
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    const menu = await openRowMenu(container, 'gui02');
    fireEvent.click(within(menu).getByText('Delete'));
    await confirmPopconfirm();

    await waitFor(() => expect(deleteNode).toHaveBeenCalledWith('gui02'));
  });

  it('loses a single node from its row menu', async () => {
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    const menu = await openRowMenu(container, 'gui02');
    fireEvent.click(within(menu).getByText('Lost'));
    await confirmPopconfirm();

    await waitFor(() => expect(lostNode).toHaveBeenCalledWith('gui02'));
  });

  it('opens the property editor on the row, without the connection-name prop', async () => {
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    const menu = await openRowMenu(container, 'gui01');
    fireEvent.click(within(menu).getByText('Properties'));

    await waitFor(() => expect(hoisted.propertyForm.open).toHaveBeenCalled());
    // CurStltConnName is the controller's own bookkeeping, not an editable prop.
    expect(JSON.parse(screen.getByTestId('property-form').dataset.initial as string)).toEqual({
      'Aux/owner': 'team-a',
      name: 'gui01',
    });
  });

  it('saves edited properties against the node the menu was opened on', async () => {
    const { container } = renderList();
    await waitFor(() => expect(rows(container)).toHaveLength(2));

    const menu = await openRowMenu(container, 'gui02');
    fireEvent.click(within(menu).getByText('Properties'));
    await waitFor(() => expect(hoisted.propertyForm.open).toHaveBeenCalled());

    hoisted.propertyForm.submit?.({ override_props: { 'Aux/owner': 'team-b' } });

    await waitFor(() =>
      expect(updateNode).toHaveBeenCalledWith({
        node: 'gui02',
        body: { override_props: { 'Aux/owner': 'team-b' } },
      }),
    );
  });

  it('shows an empty table rather than failing when the controller answers nothing', async () => {
    vi.mocked(getNodes).mockResolvedValue({ data: undefined } as never);
    const { container } = renderList();

    await waitFor(() => expect(getNodes).toHaveBeenCalled());
    expect(rows(container)).toHaveLength(0);
    expect(container.querySelector('.ant-empty')).not.toBeNull();
  });
});
