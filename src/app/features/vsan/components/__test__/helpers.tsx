// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { expect } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const renderWithClient = (ui: React.ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};

/** Pick an option from an antd Select by the text of the option. */
export const selectOption = async (combobox: HTMLElement, text: string | RegExp) => {
  fireEvent.mouseDown(combobox);
  const option = await waitFor(() => {
    const options = Array.from(document.querySelectorAll('.ant-select-item-option-content'));
    const match = options.find((el) =>
      typeof text === 'string' ? el.textContent === text : text.test(el.textContent ?? ''),
    );
    expect(match).toBeDefined();
    return match as HTMLElement;
  });
  fireEvent.click(option);
};

/** Confirm the project Popconfirm that just opened. */
export const confirmPopover = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
};

export const expectModalClosed = async () => {
  await waitFor(() => {
    const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
    expect(!wrap || wrap.style.display === 'none').toBe(true);
  });
};

export const openDialog = async () => screen.findByRole('dialog');

export const dialogButton = (dialog: HTMLElement, name: string) => within(dialog).getByRole('button', { name });

/** The visible rows of an antd table body (measure and placeholder rows excluded). */
export const tableRows = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.ant-table-tbody tr.ant-table-row')) as HTMLElement[];

export const rowByText = (container: HTMLElement, text: string) => {
  const row = tableRows(container).find((tr) => tr.textContent?.includes(text));
  expect(row).toBeDefined();
  return row as HTMLElement;
};

export const apiError = (message: string, detail?: string, explanation?: string) => ({
  message,
  detail,
  explanation,
});
