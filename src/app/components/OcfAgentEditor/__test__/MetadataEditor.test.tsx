// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { MetadataEditor } from '../MetadataEditor';

type Values = Record<string, string | number | boolean>;

const renderEditor = (initialValues: Values = {}) => {
  const onValuesChange = vi.fn();
  const utils = render(<MetadataEditor initialValues={initialValues} onValuesChange={onValuesChange} />);
  return { ...utils, onValuesChange };
};

const keys = () => screen.queryAllByPlaceholderText('Key') as HTMLInputElement[];
const values = () => screen.queryAllByPlaceholderText('Value') as HTMLInputElement[];

describe('MetadataEditor', () => {
  it('shows one row per entry', async () => {
    renderEditor({ name: 'web', weight: 2 });

    await waitFor(() => expect(keys()).toHaveLength(2));
    expect(keys().map((input) => input.value)).toEqual(['name', 'weight']);
    expect(values().map((input) => input.value)).toEqual(['web', '2']);
  });

  it('reports edits as an object keyed by the row keys', async () => {
    const { onValuesChange } = renderEditor({ name: 'web' });
    await waitFor(() => expect(keys()).toHaveLength(1));

    fireEvent.change(values()[0], { target: { value: 'db' } });
    expect(onValuesChange).toHaveBeenLastCalledWith({ name: 'db' });

    fireEvent.change(keys()[0], { target: { value: 'role' } });
    expect(onValuesChange).toHaveBeenLastCalledWith({ role: 'db' });
  });

  it('adds and removes rows and ignores rows without a key', async () => {
    const { onValuesChange } = renderEditor({ name: 'web' });
    await waitFor(() => expect(keys()).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: /Add Metadata/ }));
    await waitFor(() => expect(keys()).toHaveLength(2));
    expect(onValuesChange).toHaveBeenLastCalledWith({ name: 'web' });

    fireEvent.change(values()[1], { target: { value: 'orphan' } });
    expect(onValuesChange).toHaveBeenLastCalledWith({ name: 'web' });

    fireEvent.change(keys()[1], { target: { value: 'tier' } });
    expect(onValuesChange).toHaveBeenLastCalledWith({ name: 'web', tier: 'orphan' });

    fireEvent.click(document.querySelectorAll('.anticon-minus-circle')[0] as HTMLElement);
    await waitFor(() => expect(keys()).toHaveLength(1));
    expect(onValuesChange).toHaveBeenLastCalledWith({ tier: 'orphan' });
  });

  it('keeps the rows when the parent echoes an internal edit but follows real changes', async () => {
    const { rerender, onValuesChange } = renderEditor({ name: 'web' });
    await waitFor(() => expect(keys()).toHaveLength(1));

    fireEvent.change(values()[0], { target: { value: 'db' } });
    const echoed = onValuesChange.mock.calls[0][0] as Values;
    rerender(<MetadataEditor initialValues={echoed} onValuesChange={onValuesChange} />);
    expect(values()[0].value).toBe('db');

    rerender(<MetadataEditor initialValues={{ other: 'x' }} onValuesChange={onValuesChange} />);
    await waitFor(() => expect(keys()[0].value).toBe('other'));
    expect(values()[0].value).toBe('x');
  });

  it('flags missing keys and values', async () => {
    renderEditor({});

    fireEvent.click(screen.getByRole('button', { name: /Add Metadata/ }));
    await waitFor(() => expect(keys()).toHaveLength(1));
    fireEvent.change(keys()[0], { target: { value: 'k' } });
    fireEvent.change(keys()[0], { target: { value: '' } });
    fireEvent.change(values()[0], { target: { value: 'v' } });
    fireEvent.change(values()[0], { target: { value: '' } });

    expect(await screen.findByText('Missing key')).toBeInTheDocument();
    expect(await screen.findByText('Missing value')).toBeInTheDocument();
  });
});
