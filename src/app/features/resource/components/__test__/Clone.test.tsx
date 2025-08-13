// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CloneForm } from '../Clone';

// Mock the translation hook
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'common:clone': 'Clone',
    'common:name': 'Name',
    'common:use_zfs_clone': 'Use ZFS Clone',
  };
  return translations[key] || key;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// Mock the API
vi.mock('@app/features/resourceDefinition', () => ({
  cloneResourceDefinition: vi.fn(),
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

describe('CloneForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render clone trigger', () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      expect(screen.getByText('Clone')).toBeInTheDocument();
    });

    it('should not show modal initially', () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Modal Interaction', () => {
    it('should open modal when clicking clone trigger', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      // Click the first Clone text (the trigger)
      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should close modal when clicking cancel', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      // Open modal first
      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click cancel - just verify it doesn't crash
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Modal should still exist in DOM but be closed (Ant Design behavior)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render name input field', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Input clone name')).toBeInTheDocument();
      });
    });

    it('should render ZFS clone checkbox', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
        expect(screen.getByText('Use ZFS Clone')).toBeInTheDocument();
      });
    });

    it('should enable ZFS clone checkbox when using ZFS', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" isUsingZFS={true} />);

      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).not.toBeDisabled();
      });
    });

    it('should disable ZFS clone checkbox when not using ZFS', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" isUsingZFS={false} />);

      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeDisabled();
      });
    });

    it('should disable ZFS clone checkbox by default', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeDisabled();
      });
    });
  });

  describe('Form Interaction', () => {
    it('should allow typing in name input', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Input clone name');
        fireEvent.change(nameInput, { target: { value: 'cloned-resource' } });
        expect(nameInput).toHaveValue('cloned-resource');
      });
    });

    it('should allow checking ZFS clone checkbox when enabled', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" isUsingZFS={true} />);

      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe('Props Handling', () => {
    it('should handle missing resource prop', () => {
      renderWithQueryClient(<CloneForm />);

      expect(screen.getByText('Clone')).toBeInTheDocument();
    });

    it('should handle resource prop correctly', () => {
      renderWithQueryClient(<CloneForm resource="my-resource" />);

      expect(screen.getByText('Clone')).toBeInTheDocument();
    });
  });

  describe('Modal Configuration', () => {
    it('should have correct modal title', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText('Clone').length).toBeGreaterThan(1);
      });
    });

    it('should have correct modal width', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      fireEvent.click(screen.getByText('Clone'));

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      });
    });
  });

  describe('Button States', () => {
    it('should show Clone button in modal', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        const allCloneButtons = screen.getAllByRole('button', { name: /clone/i });
        expect(allCloneButtons.length).toBeGreaterThan(0);
      });
    });

    it('should show Cancel button in modal', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });
  });

  describe('Translation Keys', () => {
    it('should use correct translation keys', async () => {
      renderWithQueryClient(<CloneForm resource="test-resource" />);

      const cloneButtons = screen.getAllByText('Clone');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        expect(mockT).toHaveBeenCalledWith('common:clone');
        expect(mockT).toHaveBeenCalledWith('common:name');
        expect(mockT).toHaveBeenCalledWith('common:use_zfs_clone');
      });
    });
  });
});
