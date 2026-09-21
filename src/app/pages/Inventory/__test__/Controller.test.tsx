// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { Controller } from '../Controller';
import { getControllerProperties, updateController } from '@app/features/node';
import { renderPage, selectOption, confirmPopover, tableRows, rowByText, ok } from './helpers';

vi.mock('@app/features/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/node')>()),
  getControllerProperties: vi.fn(),
  updateController: vi.fn(),
}));

vi.mock('@app/components/PropertyForm', () => ({
  default: ({ children, handleSubmit }: { children?: React.ReactNode; handleSubmit: (d: unknown) => void }) => (
    <div>
      {children}
      <button data-testid="property-form-submit" onClick={() => handleSubmit({ override_props: { 'Aux/new': '1' } })}>
        submit-property
      </button>
    </div>
  ),
}));

// Keys chosen so each branch of the editor is covered: an Aux property the
// catalog does not know, a boolean, a single-select and a plain text one.
const properties = {
  'Aux/owner': 'team-a',
  'DrbdOptions/AutoEvictAllowEviction': 'true',
  'NVMe/TRType': 'tcp',
  TcpPortAutoRange: '7000-7999',
};

const enterEditMode = () => fireEvent.click(screen.getAllByRole('switch')[0]);

const renderController = async () => {
  const utils = renderPage(<Controller />);
  await waitFor(() => expect(tableRows(utils.container).length).toBe(4));
  return utils;
};

describe('Controller page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getControllerProperties).mockResolvedValue({ data: properties } as never);
    vi.mocked(updateController).mockResolvedValue(ok as never);
  });

  it('lists every controller property as plain text until edit mode', async () => {
    const { container } = await renderController();

    expect(screen.getByRole('columnheader', { name: 'Controller Properties' })).toBeInTheDocument();
    expect(rowByText(container, 'Aux/owner')).toHaveTextContent('team-a');
    expect(rowByText(container, 'NVMe/TRType')).toHaveTextContent('tcp');
    expect(rowByText(container, 'TcpPortAutoRange')).toHaveTextContent('7000-7999');

    // Only the edit-mode toggle itself is a switch while reading.
    expect(screen.getAllByRole('switch')).toHaveLength(1);
    expect(container.querySelectorAll('input[type="text"]')).toHaveLength(0);
  });

  it('shows one editor per property type in edit mode', async () => {
    const { container } = await renderController();
    enterEditMode();

    const aux = rowByText(container, 'Aux/owner');
    expect(within(aux).getByRole('textbox')).toHaveValue('team-a');

    const boolean = rowByText(container, 'DrbdOptions/AutoEvictAllowEviction');
    expect(within(boolean).getByRole('switch')).toBeChecked();

    const select = rowByText(container, 'NVMe/TRType');
    expect(within(select).getByRole('combobox')).toBeInTheDocument();

    // A catalog property that is neither boolean nor a select stays read-only.
    const text = rowByText(container, 'TcpPortAutoRange');
    expect(within(text).queryByRole('textbox')).toBeNull();
    expect(text).toHaveTextContent('7000-7999');
  });

  it('saves an edited Aux value and reloads', async () => {
    const { container } = await renderController();
    enterEditMode();

    fireEvent.change(within(rowByText(container, 'Aux/owner')).getByRole('textbox'), {
      target: { value: 'team-b' },
    });

    await waitFor(() => expect(updateController).toHaveBeenCalledWith({ override_props: { 'Aux/owner': 'team-b' } }));
    await waitFor(() => expect(getControllerProperties).toHaveBeenCalledTimes(2));
  });

  it('saves a boolean as a string', async () => {
    const { container } = await renderController();
    enterEditMode();

    fireEvent.click(within(rowByText(container, 'DrbdOptions/AutoEvictAllowEviction')).getByRole('switch'));

    await waitFor(() =>
      expect(updateController).toHaveBeenCalledWith({
        override_props: { 'DrbdOptions/AutoEvictAllowEviction': 'false' },
      }),
    );
  });

  it('saves the value picked from a select', async () => {
    const { container } = await renderController();
    enterEditMode();

    await selectOption(within(rowByText(container, 'NVMe/TRType')).getByRole('combobox'), 'rdma');

    await waitFor(() => expect(updateController).toHaveBeenCalledWith({ override_props: { 'NVMe/TRType': 'rdma' } }));
  });

  it('deletes a known property after confirmation', async () => {
    const { container } = await renderController();
    enterEditMode();

    const row = rowByText(container, 'NVMe/TRType');
    fireEvent.click(within(row).getByRole('button'));
    expect(await screen.findByText('Are you sure to delete this property?')).toBeInTheDocument();
    await confirmPopover();

    await waitFor(() => expect(updateController).toHaveBeenCalledWith({ delete_props: ['NVMe/TRType'] }));
    await waitFor(() => expect(getControllerProperties).toHaveBeenCalledTimes(2));
  });

  it('adds a property through the property form', async () => {
    await renderController();

    expect(screen.getByRole('button', { name: /Add Property/ })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('property-form-submit'));

    await waitFor(() => expect(updateController).toHaveBeenCalledWith({ override_props: { 'Aux/new': '1' } }));
  });

  it('renders an empty table when the controller has no properties', async () => {
    vi.mocked(getControllerProperties).mockResolvedValue({ data: {} } as never);
    const { container } = renderPage(<Controller />);

    await waitFor(() => expect(getControllerProperties).toHaveBeenCalled());
    expect(tableRows(container)).toHaveLength(0);
  });
});
