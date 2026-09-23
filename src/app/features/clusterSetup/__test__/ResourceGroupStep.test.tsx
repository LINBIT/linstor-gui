// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ResourceGroupStep, type ResourceGroupStepHandle } from '../components/ResourceGroupStep';

// Opens the service Select dropdown and clicks the option with the given label.
const chooseService = async (label: 'VM' | 'HA') => {
  fireEvent.mouseDown(screen.getByRole('combobox'));
  const option = await screen.findByText(label, { selector: '.ant-select-item-option-content' });
  fireEvent.click(option);
};

describe('ResourceGroupStep', () => {
  beforeEach(() => {
    // no-op
  });

  it('renders name, place count, and service selector', () => {
    render(<ResourceGroupStep nodeCount={3} />);
    expect(screen.getByLabelText(/Resource group name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Place count/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('pre-fills the property rows when a service is chosen', async () => {
    render(<ResourceGroupStep nodeCount={3} />);
    await chooseService('VM');

    await waitFor(() => {
      expect(screen.getByDisplayValue('DrbdOptions/Net/rr-conflict')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('retry-connect')).toBeInTheDocument();
    expect((screen.getByLabelText(/Resource group name/i) as HTMLInputElement).value).toBe('vm-data');
  });

  it('validateAndGet() returns name, place_count and the HA preset props without any API call', async () => {
    const ref = React.createRef<ResourceGroupStepHandle>();
    render(<ResourceGroupStep ref={ref} nodeCount={3} />);

    await chooseService('HA');
    await waitFor(() => {
      expect(screen.getByDisplayValue('DrbdOptions/Resource/quorum')).toBeInTheDocument();
    });

    const plan = await ref.current!.validateAndGet();
    expect(plan.name).toBe('ha-data');
    expect(plan.select_filter).toEqual({ place_count: 2 });
    expect(plan.props).toEqual({
      'DrbdOptions/Resource/on-no-data-accessible': 'io-error',
      'DrbdOptions/Resource/auto-promote': 'no',
      'DrbdOptions/Resource/quorum': 'majority',
      'DrbdOptions/Resource/on-no-quorum': 'io-error',
      'DrbdOptions/Resource/on-suspended-primary-outdated': 'force-secondary',
    });
  });

  it('shows the HA-needs-three-nodes warning when nodeCount<3 and HA is chosen', async () => {
    render(<ResourceGroupStep nodeCount={2} />);
    await chooseService('HA');
    expect(await screen.findByText(/HA preset assumes at least three nodes/i)).toBeInTheDocument();
  });

  it('validateAndGet() rejects when the name is missing', async () => {
    const ref = React.createRef<ResourceGroupStepHandle>();
    render(<ResourceGroupStep ref={ref} nodeCount={3} />);
    await expect(ref.current!.validateAndGet()).rejects.toBeTruthy();
  });

  it('collects hand-edited property rows and drops blank keys', async () => {
    const ref = React.createRef<ResourceGroupStepHandle>();
    render(<ResourceGroupStep ref={ref} nodeCount={3} />);
    fireEvent.change(screen.getByLabelText(/Resource group name/i), { target: { value: 'custom' } });

    fireEvent.click(screen.getByRole('button', { name: /Add property/ }));
    fireEvent.click(screen.getByRole('button', { name: /Add property/ }));
    fireEvent.click(screen.getByRole('button', { name: /Add property/ }));
    const keys = screen.getAllByPlaceholderText('Property');
    const values = screen.getAllByPlaceholderText('Value');
    fireEvent.change(keys[0], { target: { value: ' DrbdOptions/Net/protocol ' } });
    fireEvent.change(values[0], { target: { value: ' C ' } });
    fireEvent.change(keys[1], { target: { value: 'Aux/doomed' } });
    // The third row is left without a key and must not reach the controller.
    fireEvent.change(values[2], { target: { value: 'orphan' } });

    // Remove the second row.
    fireEvent.click(screen.getAllByRole('button', { name: /Delete/ })[1]);
    expect(screen.getAllByPlaceholderText('Property')).toHaveLength(2);

    const plan = await ref.current!.validateAndGet();
    expect(plan).toEqual({
      name: 'custom',
      select_filter: { place_count: 2 },
      props: { 'DrbdOptions/Net/protocol': 'C' },
    });
  });

  it('sends no place count when the field is cleared', async () => {
    const ref = React.createRef<ResourceGroupStepHandle>();
    render(<ResourceGroupStep ref={ref} nodeCount={3} />);
    fireEvent.change(screen.getByLabelText(/Resource group name/i), { target: { value: 'rg' } });
    fireEvent.change(screen.getByLabelText(/Place count/i), { target: { value: '' } });

    await waitFor(async () => expect((await ref.current!.validateAndGet()).select_filter).toEqual({}));
  });
});
