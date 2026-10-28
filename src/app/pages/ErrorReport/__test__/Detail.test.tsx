// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { getErrorReportById } from '@app/features/report';
import ErrorReportDetail from '../Detail';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { id?: string }) => (key === 'not_found' ? `not_found ${params?.id}` : key),
  }),
}));

// PageBasic needs the app's NavProvider; the page under test only needs
// its title and children.
vi.mock('@app/components/PageBasic', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));

vi.mock('@app/features/report', () => ({
  getErrorReportById: vi.fn(),
}));

const renderDetail = (id: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[`/error-reports/${id}`]}>
        <Routes>
          <Route path="/error-reports/:id" element={<ErrorReportDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('ErrorReportDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the report text', async () => {
    vi.mocked(getErrorReportById).mockResolvedValue({ data: [{ text: 'ERROR REPORT 6AB3756C' }] } as never);
    renderDetail('6AB3756C-00000-000000');
    expect(await screen.findByText('ERROR REPORT 6AB3756C')).toBeInTheDocument();
    expect(getErrorReportById).toHaveBeenCalledWith('6AB3756C-00000-000000');
  });

  it('says the report was not found when the controller returns no report', async () => {
    vi.mocked(getErrorReportById).mockResolvedValue({ data: [] } as never);
    renderDetail('NOPE-0000');
    expect(await screen.findByText('not_found NOPE-0000')).toBeInTheDocument();
    expect(screen.getByText('detail_title')).toBeInTheDocument();
  });
});
