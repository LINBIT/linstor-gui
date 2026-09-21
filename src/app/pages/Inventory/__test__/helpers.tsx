// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const renderPage = (ui: React.ReactElement, path = '/') => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};

/** Pick an antd Select option by its title (each option is rendered twice). */
export const selectOption = async (combobox: HTMLElement, title: string) => {
  fireEvent.mouseDown(combobox);
  const option = await waitFor(() => {
    const found = document.querySelector(`.ant-select-item[title="${title}"] .ant-select-item-option-content`);
    expect(found).not.toBeNull();
    return found as HTMLElement;
  });
  fireEvent.click(option);
};

export const confirmPopover = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
};

export const tableRows = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.ant-table-tbody tr.ant-table-row')) as HTMLElement[];

export const rowByText = (container: HTMLElement, text: string) => {
  const row = tableRows(container).find((tr) => tr.textContent?.includes(text));
  expect(row).toBeDefined();
  return row as HTMLElement;
};

export const ok = { data: [{ ret_code: 1, message: 'ok' }] };
