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
  getErrorReportPage: vi.fn(),
  deleteReport: vi.fn(),
  deleteReportBulk: vi.fn(),
}));

// The list picks its data source by the controller's REST API version.
vi.mock('@app/features/node/api', () => ({ getControllerVersion: vi.fn() }));

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

import { getErrorReports, getErrorReportPage, deleteReport, deleteReportBulk } from '../../api';
import { getControllerVersion } from '@app/features/node/api';
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

const restApi = (version: string) =>
  vi.mocked(getControllerVersion).mockResolvedValue({ data: { rest_api_version: version } } as never);

describe('error report List before REST 1.30.0 (everything in the browser)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMode = 'NORMAL';
    restApi('1.29.1');
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

  it('links into the HCI routes in HCI mode', async () => {
    uiMode = 'HCI';
    renderList();
    expect((await screen.findByText('AAAA-000001')).closest('a')).toHaveAttribute(
      'href',
      '/hci/error-reports/AAAA-000001',
    );
    expect(screen.getByText('node-1').closest('a')).toHaveAttribute('href', '/hci/nodes/node-1');
  });

  it('links into the VSAN routes in VSAN mode', async () => {
    uiMode = 'VSAN';
    renderList();
    expect((await screen.findByText('AAAA-000001')).closest('a')).toHaveAttribute(
      'href',
      '/vsan/error-reports/AAAA-000001',
    );
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

  it('never asks for the paged view', async () => {
    renderList();
    await screen.findByText('AAAA-000001');
    expect(getErrorReportPage).not.toHaveBeenCalled();
  });
});

// A stand-in for the controller's GET /v1/view/error-reports: filter, sort,
// then slice, and leave `items` out of an empty page as the real one does.
const many = Array.from({ length: 25 }, (_, i) => ({
  filename: `ErrorReport-R${String(i).padStart(3, '0')}-000000.log`,
  node_name: `node-${(i % 2) + 1}`,
  module: i % 3 === 0 ? 'CONTROLLER' : 'SATELLITE',
  error_time: DAY1 + i * 60_000,
  exception: 'LinStorException',
  exception_message: `failure ${i}`,
}));

type PageQuery = {
  node?: string[];
  module?: string;
  since?: number;
  to?: number;
  limit?: number;
  offset?: number;
  sort_by?: keyof (typeof many)[number];
  sort_order?: 'asc' | 'desc';
};

let store = many;
const fakeController = async (query: PageQuery) => {
  const { limit = 1000, offset = 0, sort_by = 'error_time', sort_order = 'desc' } = query;
  const matching = store
    .filter((r) => !query.node || query.node.includes(r.node_name))
    .filter((r) => !query.module || r.module === query.module)
    .filter((r) => query.since == null || (r.error_time >= query.since && r.error_time <= (query.to as number)))
    .sort((a, b) => {
      const cmp = String(a[sort_by]).localeCompare(String(b[sort_by]), undefined, { numeric: true });
      return sort_order === 'asc' ? cmp : -cmp;
    });
  const items = matching.slice(offset, offset + limit);
  return {
    data: { total: matching.length, limit, offset, sort_by, sort_order, ...(items.length > 0 && { items }) },
  } as never;
};

const shownIds = () =>
  Array.from(document.querySelectorAll('.ant-table-tbody tr.ant-table-row')).map(
    (tr) => tr.textContent?.match(/R\d{3}-000000/)?.[0],
  );

const lastPageQuery = () => vi.mocked(getErrorReportPage).mock.lastCall?.[0];

const header = (title: string) =>
  Array.from(document.querySelectorAll('th.ant-table-column-has-sorters')).find(
    (th) => th.textContent === title,
  ) as HTMLElement;

describe('error report List from REST 1.30.0 (paged on the controller)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMode = 'NORMAL';
    restApi('1.30.0');
    store = many;
    vi.mocked(getErrorReportPage).mockImplementation(fakeController as never);
    vi.mocked(deleteReport).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    vi.mocked(deleteReportBulk).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('asks the controller for the first page, newest first, and shows its total', async () => {
    renderList();

    await waitFor(() => expect(shownIds()).toHaveLength(10));
    expect(getErrorReportPage).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      sort_by: 'error_time',
      sort_order: 'desc',
    });
    expect(shownIds()[0]).toBe('R024-000000');
    expect(screen.getByText('Total 25 items')).toBeInTheDocument();
    // The full list is never pulled.
    expect(getErrorReports).not.toHaveBeenCalled();
  });

  it('turns pages and page sizes into offset and limit', async () => {
    renderList();
    await waitFor(() => expect(shownIds()).toHaveLength(10));

    fireEvent.click(screen.getByRole('listitem', { name: '3' }));
    await waitFor(() => expect(shownIds()).toHaveLength(5));
    expect(lastPageQuery()).toMatchObject({ limit: 10, offset: 20 });
    expect(shownIds()[0]).toBe('R004-000000');

    fireEvent.mouseDown(document.querySelector('.ant-pagination-options .ant-select-selector') as HTMLElement);
    fireEvent.click(await screen.findByText('20 / page', { selector: '.ant-select-item-option-content' }));
    // A new page size starts over from page one.
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ limit: 20, offset: 0 }));
    await waitFor(() => expect(shownIds()).toHaveLength(20));
  });

  it('sorts on the controller and starts over from page one', async () => {
    renderList();
    await waitFor(() => expect(shownIds()).toHaveLength(10));
    fireEvent.click(screen.getByRole('listitem', { name: '2' }));
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ offset: 10 }));

    fireEvent.click(header('Node'));
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ sort_by: 'node_name', sort_order: 'asc', offset: 0 }));
    fireEvent.click(header('Node'));
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ sort_by: 'node_name', sort_order: 'desc' }));
    // A third click clears the column's sort: back to newest first.
    fireEvent.click(header('Node'));
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ sort_by: 'error_time', sort_order: 'desc' }));
  });

  it('flips the time column to oldest first on the first click', async () => {
    renderList();
    await waitFor(() => expect(shownIds()).toHaveLength(10));

    fireEvent.click(header('Time'));

    await waitFor(() => expect(lastPageQuery()).toMatchObject({ sort_by: 'error_time', sort_order: 'asc' }));
    await waitFor(() => expect(shownIds()[0]).toBe('R000-000000'));
  });

  it.each([
    ['ID', 'filename'],
    ['Module', 'module'],
    ['Content', 'exception_message'],
  ])('sorts by %s as %s', async (title, field) => {
    renderList();
    await waitFor(() => expect(shownIds()).toHaveLength(10));

    fireEvent.click(header(title));

    await waitFor(() => expect(lastPageQuery()).toMatchObject({ sort_by: field, sort_order: 'asc' }));
  });

  it('filters node and time range on the controller', async () => {
    renderList(`/error-reports?node=node-1&since=${DAY1}&to=${DAY1 + 10 * 60_000}`);

    await waitFor(() =>
      expect(getErrorReportPage).toHaveBeenCalledWith(
        expect.objectContaining({ node: ['node-1'], since: DAY1, to: DAY1 + 10 * 60_000 }),
      ),
    );
    // R000, R002 … R010 are node-1 inside the first ten minutes.
    await waitFor(() =>
      expect(shownIds()).toEqual([
        'R010-000000',
        'R008-000000',
        'R006-000000',
        'R004-000000',
        'R002-000000',
        'R000-000000',
      ]),
    );
  });

  it('filters by module on the controller and goes back to page one', async () => {
    renderList();
    await waitFor(() => expect(shownIds()).toHaveLength(10));
    fireEvent.click(screen.getByRole('listitem', { name: '2' }));
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ offset: 10 }));

    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByText('Controller', { selector: '.ant-select-item-option-content' }));

    await waitFor(() => expect(lastPageQuery()).toMatchObject({ module: 'CONTROLLER', offset: 0 }));
    await waitFor(() => expect(screen.getByText('Total 9 items')).toBeInTheDocument());
  });

  it('search writes the filter to the URL and starts over from page one', async () => {
    renderList();
    await waitFor(() => expect(shownIds()).toHaveLength(10));
    fireEvent.click(screen.getByRole('listitem', { name: '2' }));
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ offset: 10 }));

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByText('node-2', { selector: '.ant-select-item-option-content' }));
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => expect(lastPageQuery()).toMatchObject({ node: ['node-2'], offset: 0 }));
    expect(navigate).toHaveBeenCalledWith('/error-reports?node=node-2');
  });

  it('shows an empty table for a page the controller sends without items', async () => {
    store = [];
    renderList();

    await waitFor(() => expect(getErrorReportPage).toHaveBeenCalled());
    expect((await screen.findAllByText('No data')).length).toBeGreaterThan(0);
  });

  it('steps back when a delete empties the last page', async () => {
    renderList();
    await waitFor(() => expect(shownIds()).toHaveLength(10));
    fireEvent.click(screen.getByRole('listitem', { name: '3' }));
    await waitFor(() => expect(shownIds()).toHaveLength(5));

    // The five reports on page 3 go away (e.g. deleted from another tab).
    store = many.slice(5);
    const [, ...rows] = screen.getAllByRole('checkbox');
    rows.forEach((box) => fireEvent.click(box));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));

    await waitFor(() => expect(deleteReportBulk).toHaveBeenCalled());
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ offset: 10 }));
    await waitFor(() => expect(shownIds()).toHaveLength(10));
  });

  it('keeps a selection across pages and drops it once deleted', async () => {
    renderList();
    await waitFor(() => expect(shownIds()).toHaveLength(10));

    fireEvent.click(screen.getAllByRole('checkbox')[1]); // R024 on page 1
    fireEvent.click(screen.getByRole('listitem', { name: '2' }));
    await waitFor(() => expect(shownIds()[0]).toBe('R014-000000'));
    fireEvent.click(screen.getAllByRole('checkbox')[1]); // R014 on page 2

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));

    await waitFor(() => expect(deleteReportBulk).toHaveBeenCalledWith({ ids: ['R024-000000', 'R014-000000'] }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled());
  });

  it('asks for nothing until the controller version is known', async () => {
    vi.mocked(getControllerVersion).mockReturnValue(new Promise(() => undefined) as never);
    renderList();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getErrorReportPage).not.toHaveBeenCalled();
    expect(getErrorReports).not.toHaveBeenCalled();
  });
});
