// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { createRoot } from 'react-dom/client';
import { App } from './app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { i18n } from './i18n';

export { i18n };

const setupDevTools = async () => {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return;
  }

  const { default: VConsole } = await import('vconsole');
  new VConsole();
};

const queryClient = new QueryClient();
const domNode = document.getElementById('root') || document.createElement('div');
const root = createRoot(domNode);

void setupDevTools().finally(() => {
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
  // The boot splash is otherwise hidden only by the main stylesheet; if that
  // one request fails, the splash would cover a fully working app forever.
  document.getElementById('app-loading')?.remove();
});
