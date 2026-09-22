// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { expect } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { NavContext } from '@app/hooks/useNav';

// PageBasic navigates and measures itself against the nav.
const nav = { isNavOpen: true, toggleNav: () => undefined, setNavOpen: () => undefined };

export const renderSettings = (ui: React.ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NavContext.Provider value={nav}>{ui}</NavContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

/** antd labels a Form.Item by its text, so switches are found by aria-label. */
export const switchByLabel = (container: HTMLElement, label: string) => {
  const found = container.querySelector(`button[role="switch"][aria-label="${label}"]`);
  expect(found).not.toBeNull();
  return found as HTMLElement;
};

export const setInput = (input: HTMLElement, value: string) => {
  fireEvent.change(input, { target: { value } });
};

export const flush = () => waitFor(() => undefined);
