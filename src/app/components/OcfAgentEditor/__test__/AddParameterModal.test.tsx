// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

import { AddParameterModal } from '../AddParameterModal';
import type { OcfAgentWithMetadata, ResourceAgent, ResourceAgentsByProvider } from '../types';

const ipaddr2: ResourceAgent = {
  name: 'IPaddr2',
  parameters: [
    { name: 'ip', required: true, type: 'string', shortdesc: 'IPv4 or IPv6 address' },
    {
      name: 'cidr_netmask',
      type: 'integer',
      shortdesc: 'Netmask',
      longdesc: 'The netmask in CIDR notation',
      default: '24',
    },
    { name: 'nic', type: 'string' },
  ],
};

const agent = (metadata: ResourceAgent | null): OcfAgentWithMetadata => ({
  position: { section: 'resources', array_index: null, key: 'start', index: 0 },
  item: {
    original: 'ocf:heartbeat:IPaddr2 vip ip=10.0.0.5',
    is_ocf: true,
    ocf_agent: {
      original: 'ocf:heartbeat:IPaddr2 vip ip=10.0.0.5',
      provider: 'heartbeat',
      agent_type: 'IPaddr2',
      instance_name: 'vip',
      params: [{ key: 'ip', value: '10.0.0.5' }],
    },
  },
  metadata,
  instanceId: 7,
});

const catalog: ResourceAgentsByProvider = { providers: { heartbeat: [ipaddr2] } };

type Props = React.ComponentProps<typeof AddParameterModal>;

const renderModal = (props: Partial<Props> = {}) => {
  const onOk = vi.fn();
  const onCancel = vi.fn();
  const onParamChange = vi.fn();
  const utils = render(
    <AddParameterModal
      visible
      onOk={onOk}
      onCancel={onCancel}
      currentAgentIndex={7}
      selectedParam=""
      onParamChange={onParamChange}
      parsedAgents={[agent(ipaddr2)]}
      allAgents={catalog}
      {...props}
    />,
  );
  return { ...utils, onOk, onCancel, onParamChange };
};

const dialog = () => screen.getByRole('dialog');

// antd renders each option twice (a11y listbox and the visible item); click the visible one.
const pickOption = async (title: string) => {
  const option = await waitFor(() => {
    const found = document.querySelector(`.ant-select-item[title="${title}"] .ant-select-item-option-content`);
    expect(found).not.toBeNull();
    return found as HTMLElement;
  });
  fireEvent.click(option);
};

describe('AddParameterModal', () => {
  it('offers only the parameters the agent does not have yet', async () => {
    const { onParamChange } = renderModal();

    expect(dialog()).toHaveTextContent('Add Parameter');
    fireEvent.mouseDown(within(dialog()).getByRole('combobox'));
    await waitFor(() =>
      expect(document.querySelector('.ant-select-item[title="cidr_netmask - Netmask"]')).not.toBeNull(),
    );
    expect(document.querySelector('.ant-select-item[title="nic - string"]')).not.toBeNull();
    expect(document.querySelector('.ant-select-item[title^="ip "]')).toBeNull();

    await pickOption('cidr_netmask - Netmask');
    // antd passes (value, option); only the value matters here.
    expect(onParamChange.mock.calls[0][0]).toBe('cidr_netmask');
  });

  it('describes the chosen parameter and enables Add', () => {
    const { onOk } = renderModal({ selectedParam: 'cidr_netmask' });

    expect(dialog()).toHaveTextContent('integer');
    expect(dialog()).toHaveTextContent('The netmask in CIDR notation');
    expect(dialog()).toHaveTextContent('24');

    const add = within(dialog()).getByRole('button', { name: 'Add' });
    expect(add).toBeEnabled();
    fireEvent.click(add);
    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it('falls back to the short description and an empty default', () => {
    renderModal({ selectedParam: 'nic' });
    expect(dialog()).toHaveTextContent('No description available');
    expect(dialog()).toHaveTextContent('(empty)');
  });

  it('keeps Add disabled without a selection and cancels', () => {
    const { onCancel } = renderModal();

    expect(within(dialog()).getByRole('button', { name: 'Add' })).toBeDisabled();
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('looks the metadata up in the catalog when the agent carries none', async () => {
    renderModal({ parsedAgents: [agent(null)] });

    fireEvent.mouseDown(within(dialog()).getByRole('combobox'));
    await waitFor(() => expect(document.querySelector('.ant-select-item[title="nic - string"]')).not.toBeNull());
  });

  it('disables the picker when no agent is selected or known', () => {
    const { rerender } = renderModal({ currentAgentIndex: null });
    expect(within(dialog()).getByRole('combobox')).toBeDisabled();

    rerender(
      <AddParameterModal
        visible
        onOk={vi.fn()}
        onCancel={vi.fn()}
        currentAgentIndex={7}
        selectedParam=""
        onParamChange={vi.fn()}
        parsedAgents={[agent(null)]}
        allAgents={{ providers: {} }}
      />,
    );
    expect(within(dialog()).getByRole('combobox')).toBeDisabled();
  });
});
