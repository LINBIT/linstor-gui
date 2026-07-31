// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AddAgentModal } from '../AddAgentModal';
import { CatalogAgent } from '../agentCatalog';

const agents = [
  { name: 'drbd', provider: 'linbit', platform: 'linux', shortdesc: 'Manages a DRBD device', parameters: [] },
  { name: 'IPaddr2', provider: 'heartbeat', platform: 'linux', shortdesc: 'Manages a virtual IPv4', parameters: [] },
  {
    name: 'windows_service',
    provider: 'linbit',
    platform: 'windows',
    shortdesc: 'Manages a Windows service',
    parameters: [],
  },
  { name: 'HyperV', provider: 'linbit', platform: 'windows', shortdesc: 'Manages a Hyper-V VM', parameters: [] },
] as CatalogAgent[];

const renderModal = (props: Partial<React.ComponentProps<typeof AddAgentModal>> = {}) =>
  render(
    <AddAgentModal
      visible
      onOk={vi.fn()}
      onCancel={vi.fn()}
      selectedProvider=""
      onProviderChange={vi.fn()}
      selectedAgent=""
      onAgentChange={vi.fn()}
      agents={agents}
      {...props}
    />,
  );

const rowNames = () =>
  Array.from(document.querySelectorAll('tbody tr.ant-table-row')).map(
    (row) => row.querySelectorAll('td')[3]?.textContent ?? '',
  );

const pickPlatform = async (label: string) => {
  fireEvent.mouseDown(document.querySelector('.ant-select-selector') as Element);
  const option = await waitFor(() => {
    const found = document.querySelector(`.ant-select-item-option[title="${label}"]`);
    if (!found) throw new Error(`option ${label} not rendered`);
    return found;
  });
  fireEvent.click(option);
};

describe('AddAgentModal', () => {
  it('starts on Linux only — Windows agents are not offered until asked for', () => {
    renderModal();
    expect(rowNames().sort()).toEqual(['IPaddr2', 'drbd']);
    expect(screen.queryByText('windows_service')).not.toBeInTheDocument();
    expect(screen.queryByText('HyperV')).not.toBeInTheDocument();
  });

  it('shows the Windows agents once Windows is ticked', async () => {
    renderModal();
    await pickPlatform('Windows');
    await waitFor(() => expect(rowNames()).toHaveLength(4));
    expect(rowNames()).toEqual(expect.arrayContaining(['drbd', 'IPaddr2', 'windows_service', 'HyperV']));
  });

  it('can show Windows alone by dropping Linux', async () => {
    renderModal();
    await pickPlatform('Windows');
    await waitFor(() => expect(rowNames()).toHaveLength(4));
    await pickPlatform('Linux'); // toggles Linux back off
    await waitFor(() => expect(rowNames().sort()).toEqual(['HyperV', 'windows_service']));
  });

  it('marks which platform each agent belongs to', async () => {
    renderModal();
    await pickPlatform('Windows');
    await waitFor(() => expect(rowNames()).toHaveLength(4));
    expect(screen.getAllByText('Windows').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Linux').length).toBeGreaterThan(0);
  });

  it('combines the platform filter with the text search', async () => {
    renderModal();
    await pickPlatform('Windows');
    fireEvent.change(screen.getByPlaceholderText(/Search agents/i), { target: { value: 'hyper' } });
    await waitFor(() => expect(rowNames()).toEqual(['HyperV']));
  });

  it('reports the picked agent by provider and name', async () => {
    const onProviderChange = vi.fn();
    const onAgentChange = vi.fn();
    renderModal({ onProviderChange, onAgentChange });

    await pickPlatform('Windows');
    await waitFor(() => expect(rowNames()).toHaveLength(4));
    fireEvent.click(screen.getByText('windows_service'));

    expect(onProviderChange).toHaveBeenCalledWith('linbit');
    expect(onAgentChange).toHaveBeenCalledWith('windows_service');
  });

  it('cannot add until something is selected', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /^Add$/ })).toBeDisabled();
  });
});
