// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { HASetupGuide } from '../components/HASetupGuide';

const renderGuide = (props: { storagePool?: string; nodes?: string[] } = {}) => render(<HASetupGuide {...props} />);

const openGuide = () => {
  fireEvent.click(screen.getByText(/Set up a highly available LINSTOR controller/i));
};

const commandText = () => document.querySelector('pre')?.textContent ?? '';

/** antd renders the multi-select options into a popup on mouse-down. */
const openNodePicker = () => {
  fireEvent.mouseDown(document.querySelector('.ant-select-selector') as Element);
};

/** Click an entry in the dropdown — the selected tags carry the same title. */
const toggleOption = async (label: string) => {
  const option = await waitFor(() => {
    const found = document.querySelector(`.ant-select-item-option[title="${label}"]`);
    if (!found) throw new Error(`option ${label} not rendered`);
    return found;
  });
  fireEvent.click(option);
};

describe('HASetupGuide', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders the collapse label and intro', () => {
    renderGuide();
    expect(screen.getByText(/Further LINSTOR tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/Set up a highly available LINSTOR controller/i)).toBeInTheDocument();
  });

  it('shows the command for the script shipped by linstor-controller', () => {
    renderGuide({ storagePool: 'ha_sp', nodes: ['n1', 'n2', 'n3'] });
    openGuide();
    expect(commandText()).toBe(
      '/usr/share/linstor-server/bin/linstor-controller-ha-setup --storage-pool ha_sp --nodes n1,n2,n3',
    );
  });

  it('uses every node as a candidate when the cluster is small enough', () => {
    renderGuide({ storagePool: 'ha_sp', nodes: ['n1', 'n2'] });
    openGuide();
    expect(commandText()).toContain('--nodes n1,n2');
    // nothing to choose, so no picker
    expect(screen.queryByText(/Controller candidate nodes/i)).not.toBeInTheDocument();
  });

  it('lets the operator pick the candidates once the cluster has more than three nodes', async () => {
    renderGuide({ storagePool: 'ha_sp', nodes: ['n1', 'n2', 'n3', 'n4', 'n5'] });
    openGuide();
    expect(screen.getAllByText(/Controller candidate nodes/i).length).toBeGreaterThan(0);
    // preselected with the first three
    expect(commandText()).toContain('--nodes n1,n2,n3');

    openNodePicker();
    await toggleOption('n5');
    await waitFor(() => expect(commandText()).toContain('--nodes n1,n2,n3,n5'));
  });

  it('keeps the candidates in cluster order, not in click order', async () => {
    renderGuide({ nodes: ['n1', 'n2', 'n3', 'n4'] });
    openGuide();
    openNodePicker();
    await toggleOption('n1'); // deselect
    await toggleOption('n4'); // append
    await waitFor(() => expect(commandText()).toContain('--nodes n2,n3,n4'));
  });

  it('refuses to hand over a command with fewer than two candidates', async () => {
    renderGuide({ storagePool: 'ha_sp', nodes: ['n1', 'n2', 'n3', 'n4'] });
    openGuide();
    openNodePicker();
    await toggleOption('n1');
    await toggleOption('n2');

    await waitFor(() => expect(screen.getByText(/Pick at least 2 nodes/i)).toBeInTheDocument());
    // the command still mirrors the selection — it is just not copyable
    expect(commandText()).toContain('--nodes n3');
    expect(screen.getByRole('button', { name: /Copy command/i })).toBeDisabled();
  });

  it('omits the storage pool when the wizard created none — the script auto-detects', () => {
    renderGuide({ nodes: ['n1', 'n2', 'n3'] });
    openGuide();
    expect(commandText()).toBe('/usr/share/linstor-server/bin/linstor-controller-ha-setup --nodes n1,n2,n3');
  });

  it('copies the command that is shown', async () => {
    renderGuide({ storagePool: 'ha_sp', nodes: ['n1', 'n2', 'n3'] });
    openGuide();
    fireEvent.click(screen.getByRole('button', { name: /Copy command/i }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1));
    expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]).toBe(commandText());
  });

  it('adds an optional controller VIP', async () => {
    renderGuide({ storagePool: 'ha_sp', nodes: ['n1', 'n2', 'n3'] });
    openGuide();
    // no VIP by default — the option is opt-in
    expect(commandText()).not.toContain('--vip');

    fireEvent.change(screen.getByLabelText(/Controller virtual IP/i), { target: { value: '10.0.0.100/24' } });
    await waitFor(() => expect(commandText()).toContain('--vip 10.0.0.100/24'));
  });

  it('refuses a VIP without a prefix length', async () => {
    renderGuide({ nodes: ['n1', 'n2', 'n3'] });
    openGuide();
    fireEvent.change(screen.getByLabelText(/Controller virtual IP/i), { target: { value: '10.0.0.100' } });

    await waitFor(() => expect(screen.getByText(/with a prefix length/i)).toBeInTheDocument());
    expect(commandText()).not.toContain('--vip');
    expect(screen.getByRole('button', { name: /Copy command/i })).toBeDisabled();
  });

  it('tells the operator the script must run on one of the candidates', () => {
    renderGuide({ nodes: ['n1', 'n2', 'n3'] });
    openGuide();
    expect(screen.getByText(/must be one of the candidates/i)).toBeInTheDocument();
  });
});
