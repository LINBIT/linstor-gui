// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  getErrorReports: vi.fn(),
  deleteReport: vi.fn(),
  deleteReportBulk: vi.fn(),
}));

vi.mock('@app/features/node', () => ({
  useNodes: () => ({ data: [{ name: 'node-1' }, { name: 'node-2' }], isLoading: false }),
}));

// The SOS button has its own suite.
vi.mock('../DownloadSOS', () => ({
  default: () => <button>sos</button>,
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

import { getErrorReports, deleteReport, deleteReportBulk } from '../../api';
import { List } from '../List';

// error_time is in ms; TZ is pinned to UTC in setupTests.
const DAY1 = Date.UTC(2023, 10, 14, 22, 13, 20); // 2023-11-14 22:13:20
const DAY2 = Date.UTC(2023, 10, 16, 8, 0, 0); // 2023-11-16 08:00:00

const reports = [
  {
    filename: 'ErrorReport-AAAA-000001.log',
    node_name: 'node-1',
    module: 'CONTROLLER',
    error_time: DAY1,
    exception: 'java.io.IOException',
    exception_message: 'disk full',
  },
  {
    filename: 'ErrorReport-BBBB-000002.log',
    node_name: 'node-2',
    module: 'SATELLITE',
    error_time: DAY2,
    exception: 'LinStorException',
    exception_message: 'drbd down',
  },
];

const renderList = (initialEntry = '/error-reports') => {
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

const rowOf = (id: string) => screen.getByText(id).closest('tr') as HTMLElement;

const openRowMenu = async (id: string) => {
  fireEvent.mouseEnter(within(rowOf(id)).getByRole('img', { name: 'more' }));
  let menu: HTMLElement | undefined;
  await waitFor(() => {
    const open = screen
      .getAllByRole('menu')
      .filter((m) => !m.closest('.ant-dropdown')?.classList.contains('ant-dropdown-hidden'));
    expect(open).toHaveLength(1);
    menu = open[0];
  });
  return menu as HTMLElement;
};

describe('error report List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMode = 'NORMAL';
    vi.mocked(getErrorReports).mockResolvedValue({ data: reports } as never);
    vi.mocked(deleteReport).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    vi.mocked(deleteReportBulk).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('lists reports newest first with id, time, node link, module and exception', async () => {
    renderList();
    const newest = (await screen.findByText('BBBB-000002')).closest('tr') as HTMLElement;
    expect(within(newest).getByText('2023-11-16 08:00:00')).toBeInTheDocument();
    expect(within(newest).getByText('node-2').closest('a')).toHaveAttribute('href', '/inventory/nodes/node-2');
    expect(within(newest).getByText('SATELLITE')).toBeInTheDocument();
    expect(within(newest).getByText('drbd down')).toBeInTheDocument();
    expect(within(newest).getByText('LinStorException')).toBeInTheDocument();
    expect(within(newest).getByText('BBBB-000002').closest('a')).toHaveAttribute('href', '/error-reports/BBBB-000002');

    const rows = screen.getAllByRole('row').filter((r) => within(r).queryByText(/-00000/));
    expect(rows.map((r) => r.textContent?.match(/[A-Z]{4}-\d{6}/)?.[0])).toEqual(['BBBB-000002', 'AAAA-000001']);
    expect(screen.getByText('Total 2 items')).toBeInTheDocument();
    expect(getErrorReports).toHaveBeenCalledWith({});
  });

  it('links into the mode-specific routes for VSAN and HCI', async () => {
    uiMode = 'HCI';
    const { unmount } = renderList();
    expect((await screen.findByText('AAAA-000001')).closest('a')).toHaveAttribute('href', '/hci/error-reports/AAAA-000001');
    expect(screen.getByText('node-1').closest('a')).toHaveAttribute('href', '/hci/nodes/node-1');
    unmount();

    uiMode = 'VSAN';
    renderList();
    expect((await screen.findByText('AAAA-000001')).closest('a')).toHaveAttribute('href', '/vsan/error-reports/AAAA-000001');
    expect(screen.getByText('node-1').closest('a')).toHaveAttribute('href', '/vsan/nodes/node-1');
  });

  it('seeds the node filter and time range from the URL', async () => {
    renderList(`/error-reports?node=node-1&since=${DAY1 - 1000}&to=${DAY1 + 1000}`);
    await screen.findByText('AAAA-000001');
    expect(getErrorReports).toHaveBeenCalledWith({ node: 'node-1' });
    // The range is applied client-side: DAY2 falls outside it.
    expect(screen.queryByText('BBBB-000002')).not.toBeInTheDocument();
  });

  it('filters by module on the client without a new request', async () => {
    renderList();
    await screen.findByText('AAAA-000001');
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByText('Satellite', { selector: '.ant-select-item-option-content' }));
    await waitFor(() => expect(screen.queryByText('AAAA-000001')).not.toBeInTheDocument());
    expect(screen.getByText('BBBB-000002')).toBeInTheDocument();
    expect(getErrorReports).toHaveBeenCalledTimes(1);
  });

  it('search sends the node to the backend and writes it to the URL', async () => {
    renderList();
    await screen.findByText('AAAA-000001');
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByText('node-2', { selector: '.ant-select-item-option-content' }));
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(getErrorReports).toHaveBeenLastCalledWith({ node: 'node-2' }));
    expect(navigate).toHaveBeenCalledWith('/error-reports?node=node-2');
  });

  it('reset clears the filters and the URL', async () => {
    renderList('/error-reports?node=node-1');
    await screen.findByText('AAAA-000001');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(getErrorReports).toHaveBeenLastCalledWith({}));
    expect(navigate).toHaveBeenCalledWith('/error-reports');
  });

  it('view from the row menu navigates to the detail page', async () => {
    renderList();
    await screen.findByText('AAAA-000001');
    const menu = await openRowMenu('AAAA-000001');
    fireEvent.click(within(menu).getByText('View'));
    expect(navigate).toHaveBeenCalledWith('/error-reports/AAAA-000001');
  });

  it('deletes one report after confirm and refetches', async () => {
    renderList();
    await screen.findByText('AAAA-000001');
    const menu = await openRowMenu('AAAA-000001');
    fireEvent.click(within(menu).getByText('Delete'));
    expect(await screen.findByText('Are you sure to delete this error report?')).toBeInTheDocument();
    expect(deleteReport).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(deleteReport).toHaveBeenCalledWith('AAAA-000001'));
    await waitFor(() => expect(getErrorReports).toHaveBeenCalledTimes(2));
  });

  it('bulk delete needs a selection and sends the bare ids', async () => {
    renderList();
    await screen.findByText('AAAA-000001');
    const bulk = screen.getByRole('button', { name: 'Delete' });
    expect(bulk).toBeDisabled();

    const [, first, second] = screen.getAllByRole('checkbox');
    fireEvent.click(first);
    fireEvent.click(second);
    expect(bulk).toBeEnabled();
    fireEvent.click(bulk);
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));

    await waitFor(() => expect(deleteReportBulk).toHaveBeenCalledWith({ ids: ['BBBB-000002', 'AAAA-000001'] }));
    await waitFor(() => expect(getErrorReports).toHaveBeenCalledTimes(2));
  });

  it('shows an empty table when there are no reports', async () => {
    vi.mocked(getErrorReports).mockResolvedValue({ data: [] } as never);
    renderList();
    expect((await screen.findAllByText('No data')).length).toBeGreaterThan(0);
  });
});
