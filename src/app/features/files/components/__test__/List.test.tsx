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
  getFiles: vi.fn(),
  getFile: vi.fn(),
  createOrUpdateFile: vi.fn(),
  deleteFile: vi.fn(),
  deployFile: vi.fn(),
  undeployFile: vi.fn(),
}));
vi.mock('@app/features/resourceDefinition/api', () => ({
  getResourceDefinition: vi.fn(),
}));

import { getFiles, getFile, createOrUpdateFile, deleteFile, deployFile, undeployFile } from '../../api';
import { getResourceDefinition } from '@app/features/resourceDefinition/api';
import { List } from '../List';

const MOUNT = '/etc/systemd/system/var-lib-a.mount';
const CONF = '/etc/linstor.d/b.conf';
const REACTOR = '/etc/drbd-reactor.d/ha.toml';

const files = [{ path: MOUNT }, { path: CONF }, { path: REACTOR }];

// LINSTOR records a deployment as a "files<path>" prop on the resource
// definition; the mount is deployed to res-a, the conf to nobody.
const resourceDefinitions = [
  { name: 'res-a', props: { [`files${MOUNT}`]: 'true' } },
  { name: 'res-b', props: {} },
];

const renderList = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <List />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const rowOf = (path: string) => screen.getByText(path).closest('tr') as HTMLElement;

const openRowMenu = async (path: string) => {
  fireEvent.mouseEnter(within(rowOf(path)).getByRole('button', { name: 'more' }));
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

describe('files List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFiles).mockResolvedValue({ data: files } as never);
    vi.mocked(getResourceDefinition).mockResolvedValue({ data: resourceDefinitions } as never);
    vi.mocked(getFile).mockImplementation(
      async (path: string) => ({ data: { path, content: btoa(`content of ${path}`) } }) as never,
    );
    for (const fn of [createOrUpdateFile, deleteFile, deployFile, undeployFile]) {
      vi.mocked(fn).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    }
  });

  it('lists files with where they are deployed, hiding reactor configs by default', async () => {
    renderList();
    const mount = (await screen.findByText(MOUNT)).closest('tr') as HTMLElement;
    await waitFor(() => expect(within(mount).getByText('res-a')).toBeInTheDocument());
    expect(within(rowOf(CONF)).getByText('Not Deployed')).toBeInTheDocument();
    expect(screen.queryByText(REACTOR)).not.toBeInTheDocument();
    expect(screen.getByText('Total 2 items')).toBeInTheDocument();
    expect((screen.getByText('+ Add File') as HTMLElement).closest('a')).toHaveAttribute('href', '/files/create');
  });

  it('the switch reveals the DRBD Reactor configuration files', async () => {
    renderList();
    await screen.findByText(MOUNT);
    fireEvent.click(screen.getByRole('switch'));
    expect(await screen.findByText(REACTOR)).toBeInTheDocument();
    expect(screen.getByText('Total 3 items')).toBeInTheDocument();
  });

  it('the eye icon shows the decoded content', async () => {
    renderList();
    await screen.findByText(MOUNT);
    fireEvent.click(within(rowOf(CONF)).getByRole('img', { name: 'eye' }));
    expect(await screen.findByText('File Content')).toBeInTheDocument();
    expect(await screen.findByText(`content of ${CONF}`)).toBeInTheDocument();
    expect(getFile).toHaveBeenCalledWith(CONF);
  });

  it('deploys an undeployed file to a searchable choice of resource definitions', async () => {
    renderList();
    await screen.findByText(MOUNT);
    const menu = await openRowMenu(CONF);
    expect(within(menu).queryByText('Undeploy')).not.toBeInTheDocument();
    fireEvent.click(within(menu).getByText('Deploy'));
    expect(await screen.findByText('Deploy to Resource')).toBeInTheDocument();

    const select = screen.getByRole('combobox');
    // Typing filters by what the user reads, not by an internal value.
    fireEvent.change(select, { target: { value: 'res-b' } });
    const options = await screen.findAllByText(/^res-/, { selector: '.ant-select-item-option-content' });
    expect(options.map((o) => o.textContent)).toEqual(['res-b']);
    fireEvent.click(options[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(deployFile).toHaveBeenCalledWith('res-b', CONF));
    expect(await screen.findByText('File deployed successfully')).toBeInTheDocument();
    await waitFor(() => expect(getResourceDefinition).toHaveBeenCalledTimes(2));
  });

  it('offers only definitions that do not already hold the file', async () => {
    renderList();
    await screen.findByText(MOUNT);
    const menu = await openRowMenu(CONF);
    fireEvent.click(within(menu).getByText('Deploy'));
    await screen.findByText('Deploy to Resource');
    fireEvent.mouseDown(screen.getByRole('combobox'));
    const options = await screen.findAllByText(/^res-/, { selector: '.ant-select-item-option-content' });
    expect(options.map((o) => o.textContent)).toEqual(['res-a', 'res-b']);
  });

  it('tells an "already deployed" failure apart from a generic one', async () => {
    vi.mocked(deployFile).mockRejectedValue(new Error('file already exists on resource'));
    renderList();
    await screen.findByText(MOUNT);
    const menu = await openRowMenu(CONF);
    fireEvent.click(within(menu).getByText('Deploy'));
    await screen.findByText('Deploy to Resource');
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('res-b', { selector: '.ant-select-item-option-content' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByText('File is already deployed to this resource')).toBeInTheDocument();
  });

  it('undeploys a deployed file from its resource after confirm', async () => {
    renderList();
    await screen.findByText(MOUNT);
    await waitFor(() => expect(within(rowOf(MOUNT)).getByText('res-a')).toBeInTheDocument());
    const menu = await openRowMenu(MOUNT);
    expect(within(menu).queryByText('Deploy')).not.toBeInTheDocument();
    fireEvent.click(within(menu).getByText('Undeploy'));
    expect(await screen.findByText('Are you sure to undeploy this file from its resource?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(undeployFile).toHaveBeenCalledWith('res-a', MOUNT));
    expect(await screen.findByText('File undeployed successfully')).toBeInTheDocument();
  });

  it('modify loads the content, saves it re-encoded and refreshes', async () => {
    renderList();
    await screen.findByText(MOUNT);
    const menu = await openRowMenu(CONF);
    fireEvent.click(within(menu).getByText('Modify'));
    expect(await screen.findByText('Modify File')).toBeInTheDocument();
    const textarea = await screen.findByDisplayValue(`content of ${CONF}`);
    fireEvent.change(textarea, { target: { value: 'new content' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(createOrUpdateFile).toHaveBeenCalledWith(CONF, { path: CONF, content: btoa('new content') }),
    );
    expect(await screen.findByText('File modified successfully')).toBeInTheDocument();
    await waitFor(() => expect(getFiles).toHaveBeenCalledTimes(2));
  });

  it('deletes after confirm and refetches', async () => {
    renderList();
    await screen.findByText(MOUNT);
    const menu = await openRowMenu(CONF);
    fireEvent.click(within(menu).getByText('Delete'));
    expect(await screen.findByText('Are you sure to delete this file?')).toBeInTheDocument();
    expect(deleteFile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(deleteFile).toHaveBeenCalledWith(CONF));
    await waitFor(() => expect(getFiles).toHaveBeenCalledTimes(2));
  });

  it('shows an empty table when there are no files', async () => {
    vi.mocked(getFiles).mockResolvedValue({ data: [] } as never);
    renderList();
    expect((await screen.findAllByText('No data')).length).toBeGreaterThan(0);
  });
});
