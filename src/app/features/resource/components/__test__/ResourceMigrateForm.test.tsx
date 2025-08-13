// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResourceMigrateForm } from '../ResourceMigrateForm';

// Mock the translation hook
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'resource:migrate': 'Migrate Resource',
    'common:confirm': 'Confirm',
    'common:cancel': 'Cancel',
    'resource:from': 'From',
    'resource:resource': 'Resource',
    'resource:to': 'To',
  };
  return translations[key] || key;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// Mock the nodes API
vi.mock('@app/features/node', () => ({
  useNodes: vi.fn(() => ({
    data: [{ name: 'node1' }, { name: 'node2' }, { name: 'node3' }],
  })),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('ResourceMigrateForm', () => {
  const mockMigrationInfo = {
    node: 'node1',
    resource: 'test-resource',
  };

  const mockOnCreate = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should not render modal when closed', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={false}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render modal when open', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Migrate Resource')).toBeInTheDocument();
    });
  });

  describe('Modal Configuration', () => {
    it('should have correct modal title', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('Migrate Resource')).toBeInTheDocument();
    });

    it('should have correct button labels', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render all form fields', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByLabelText('From')).toBeInTheDocument();
      expect(screen.getByLabelText('Resource')).toBeInTheDocument();
      expect(screen.getByLabelText('To')).toBeInTheDocument();
    });

    it('should disable from node field', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      const fromField = screen.getByLabelText('From');
      expect(fromField).toBeDisabled();
    });

    it('should disable resource field', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      const resourceField = screen.getByLabelText('Resource');
      expect(resourceField).toBeDisabled();
    });

    it('should enable to node select field', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      const toField = screen.getByRole('combobox');
      expect(toField).not.toBeDisabled();
    });
  });

  describe('Form Values', () => {
    it('should populate form with migration info', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      const fromField = screen.getByLabelText('From');
      const resourceField = screen.getByLabelText('Resource');

      expect(fromField).toHaveValue('node1');
      expect(resourceField).toHaveValue('test-resource');
    });

    it('should update form when migration info changes', () => {
      const { rerender } = renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      const newMigrationInfo = {
        node: 'node2',
        resource: 'another-resource',
      };

      rerender(
        <QueryClientProvider client={createQueryClient()}>
          <ResourceMigrateForm
            open={true}
            onCreate={mockOnCreate}
            migrationInfo={newMigrationInfo}
            onCancel={mockOnCancel}
          />
        </QueryClientProvider>,
      );

      const fromField = screen.getByLabelText('From');
      const resourceField = screen.getByLabelText('Resource');

      expect(fromField).toHaveValue('node2');
      expect(resourceField).toHaveValue('another-resource');
    });
  });

  describe('Node Selection - Core Functionality', () => {
    it('should render to node select field', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      const toSelect = screen.getByRole('combobox');
      expect(toSelect).toBeInTheDocument();
    });
  });

  describe('Form Interaction - Core', () => {
    it('should call onCancel when cancel button is clicked', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should render form correctly', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    it('should not call onCreate when required field is missing', async () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Please select node!')).toBeInTheDocument();
      });

      expect(mockOnCreate).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation - Core', () => {
    it('should show validation error for required to node field', async () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Please select node!')).toBeInTheDocument();
      });
    });
  });

  describe('Props Handling', () => {
    it('should handle empty migration info', () => {
      const emptyMigrationInfo = { node: '', resource: '' };

      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={emptyMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      const fromField = screen.getByLabelText('From');
      const resourceField = screen.getByLabelText('Resource');

      expect(fromField).toHaveValue('');
      expect(resourceField).toHaveValue('');
    });

    it('should handle undefined migration info properties', () => {
      const partialMigrationInfo = { node: 'node1' } as any;

      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={partialMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Translation Keys', () => {
    it('should use correct translation keys', () => {
      renderWithQueryClient(
        <ResourceMigrateForm
          open={true}
          onCreate={mockOnCreate}
          migrationInfo={mockMigrationInfo}
          onCancel={mockOnCancel}
        />,
      );

      expect(mockT).toHaveBeenCalledWith('resource:migrate');
      expect(mockT).toHaveBeenCalledWith('common:confirm');
      expect(mockT).toHaveBeenCalledWith('common:cancel');
      expect(mockT).toHaveBeenCalledWith('resource:from');
      expect(mockT).toHaveBeenCalledWith('resource:resource');
      expect(mockT).toHaveBeenCalledWith('resource:to');
    });
  });
});
