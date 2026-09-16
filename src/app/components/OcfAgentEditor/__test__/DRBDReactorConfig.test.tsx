// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

import { DRBDReactorConfig, DRBDReactorConfigValues } from '../DRBDReactorConfig';

const renderConfig = (initialValues: DRBDReactorConfigValues = {}) => {
  const onValuesChange = vi.fn();
  const utils = render(<DRBDReactorConfig initialValues={initialValues} onValuesChange={onValuesChange} />);
  return { ...utils, onValuesChange };
};

const openMenu = async () => {
  fireEvent.click(screen.getByRole('button', { name: /Add Configuration/ }));
  return screen.findByRole('menu');
};

const addField = async (label: string) => {
  const menu = await openMenu();
  fireEvent.click(within(menu).getByText(label));
};

// antd renders each option twice (a11y listbox and the visible item); click the visible one.
const pickOption = async (title: string) => {
  const option = await waitFor(() => {
    const found = document.querySelector(`.ant-select-item[title="${title}"] .ant-select-item-option-content`);
    expect(found).not.toBeNull();
    return found as HTMLElement;
  });
  fireEvent.click(option);
};

const removeField = (container: HTMLElement, index = 0) =>
  fireEvent.click(container.querySelectorAll('button[title="Remove field"]')[index] as HTMLElement);

describe('DRBDReactorConfig', () => {
  it('starts empty and offers every option in the add menu', async () => {
    const { container } = renderConfig();

    expect(container.querySelectorAll('.ant-form-item')).toHaveLength(0);
    const menu = await openMenu();
    const labels = within(menu)
      .getAllByRole('menuitem')
      .map((item) => item.textContent);
    expect(labels).toEqual([
      'Runner',
      'Dependencies As',
      'Target As',
      'On DRBD Demote Failure',
      'Secondary Force',
      'Stop Services On Exit',
      'Preferred Nodes',
      'Preferred Nodes Policy',
      'Fencing Promote Delay',
      'On Quorum Loss',
    ]);
  });

  it('adds a field with its default and reports the visible values', async () => {
    const { container, onValuesChange } = renderConfig();

    await addField('Runner');
    expect(within(container).getByText('Runner')).toBeInTheDocument();
    expect(onValuesChange).toHaveBeenLastCalledWith({ runner: 'systemd' });

    await addField('Secondary Force');
    expect(onValuesChange).toHaveBeenLastCalledWith({ runner: 'systemd', 'secondary-force': true });
    expect(screen.getByRole('switch')).toBeChecked();

    const menu = await openMenu();
    expect(within(menu).queryByText('Runner')).toBeNull();
    expect(within(menu).queryByText('Secondary Force')).toBeNull();
  });

  it('reports edits to select, switch, number, text and tag fields', async () => {
    const { onValuesChange } = renderConfig();

    await addField('Runner');
    fireEvent.mouseDown(screen.getByRole('combobox'));
    await pickOption('shell');
    expect(onValuesChange).toHaveBeenLastCalledWith({ runner: 'shell' });

    await addField('Stop Services On Exit');
    fireEvent.click(screen.getByRole('switch'));
    expect(onValuesChange).toHaveBeenLastCalledWith({ runner: 'shell', 'stop-services-on-exit': true });

    await addField('Fencing Promote Delay');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '30' } });
    expect(onValuesChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ runner: 'shell', 'fencing-promote-delay': 30 }),
    );

    await addField('Dependencies As');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Wants' } });
    expect(onValuesChange).toHaveBeenLastCalledWith(expect.objectContaining({ 'dependencies-as': 'Wants' }));

    await addField('Preferred Nodes');
    const tags = screen.getAllByRole('combobox').slice(-1)[0];
    fireEvent.change(tags, { target: { value: 'node-a' } });
    fireEvent.keyDown(tags, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13 });
    await waitFor(() =>
      expect(onValuesChange).toHaveBeenLastCalledWith(expect.objectContaining({ 'preferred-nodes': ['node-a'] })),
    );
  });

  it('drops a field from the reported values when it is removed', async () => {
    const { container, onValuesChange } = renderConfig();

    await addField('Runner');
    await addField('On Quorum Loss');
    expect(within(container).getByText('On Quorum Loss')).toBeInTheDocument();

    removeField(container, 0);
    expect(within(container).queryByText('Runner')).toBeNull();
    expect(onValuesChange).toHaveBeenLastCalledWith({ 'on-quorum-loss': undefined });

    const menu = await openMenu();
    expect(within(menu).getByText('Runner')).toBeInTheDocument();
  });

  it('shows the fields that already have a value', async () => {
    renderConfig({ 'on-quorum-loss': 'freeze', 'dependencies-as': 'Wants', 'fencing-promote-delay': 5 });

    expect(await screen.findByText('On Quorum Loss')).toBeInTheDocument();
    expect(screen.getByText('freeze')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Wants');
    expect(screen.getByRole('spinbutton')).toHaveValue('5');

    const menu = await openMenu();
    expect(within(menu).queryByText('On Quorum Loss')).toBeNull();
    expect(within(menu).getByText('Runner')).toBeInTheDocument();
  });

  it('explains every field with a tooltip', async () => {
    renderConfig({ runner: 'shell' });
    await screen.findByText('Runner');

    fireEvent.mouseEnter(document.querySelector('.anticon-info-circle') as HTMLElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('What should be used to execute services');
  });
});
