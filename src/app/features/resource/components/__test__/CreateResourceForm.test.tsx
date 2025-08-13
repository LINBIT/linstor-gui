// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CreateResourceForm } from '../CreateResourceForm';

// Mock everything
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
  };
});

vi.mock('@app/features/storagePool', () => ({
  useStoragePools: () => ({ data: [], isLoading: false }),
}));

vi.mock('@app/features/resourceDefinition', () => ({
  useResourceDefinitions: () => ({ data: [], isLoading: false }),
}));

vi.mock('@app/features/node', () => ({
  useNodes: () => ({ data: [], isLoading: false }),
}));

vi.mock('@app/features/requests', () => ({
  fullySuccess: vi.fn(() => true),
}));

vi.mock('../api', () => ({
  autoPlace: vi.fn(),
  resourceCreateOnNode: vi.fn(),
  resourceModify: vi.fn(),
  getResources: vi.fn(() => Promise.resolve({ data: [] })),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false }),
  useMutation: () => ({ mutate: vi.fn(), isLoading: false }),
  QueryClient: vi.fn(() => ({})),
  QueryClientProvider: ({ children }: any) => children,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('CreateResourceForm - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => {
      renderWithProviders(<CreateResourceForm />);
    }).not.toThrow();
  });

  it('should render form elements', () => {
    renderWithProviders(<CreateResourceForm />);

    // Check basic form elements exist
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should render in edit mode', () => {
    renderWithProviders(<CreateResourceForm isEdit={true} />);

    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('should handle props correctly', () => {
    const initialValues = { name: 'test' };

    expect(() => {
      renderWithProviders(<CreateResourceForm isEdit={true} initialValues={initialValues} />);
    }).not.toThrow();
  });
});
