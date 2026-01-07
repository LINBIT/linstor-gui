// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock setup - must be before imports
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/' })),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  HashRouter: ({ children }: any) => <>{children}</>,
  Routes: ({ children }: any) => <>{children}</>,
  Route: ({ children }: any) => <>{children}</>,
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(({ mutationFn, onSuccess, onError }: any) => ({
    mutate: vi.fn((variables: any) => {
      // Simulate async mutation
      if (mutationFn) {
        return Promise.resolve(mutationFn(variables)).then(
          (result: any) => {
            if (onSuccess) onSuccess(result, variables, undefined);
          },
          (error: any) => {
            if (onError) onError(error, variables, undefined);
          },
        );
      }
      return Promise.resolve();
    }),
    isLoading: false,
  })),
  useQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  QueryClient: class {
    constructor() {}
    getQueryData() {}
    setQueryData() {}
    invalidateQueries() {}
  },
  QueryClientProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('@app/features/resourceGroup', () => ({
  useResourceGroups: vi.fn(() => ({ data: [] })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  I18nextProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('@app/utils/toast', () => ({
  notify: vi.fn(),
  logManager: {
    getLogs: vi.fn(() => []),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearLogs: vi.fn(),
  },
}));

vi.mock('@app/features/keyValueStore/api', () => ({
  getKVStore: vi.fn(() => Promise.resolve({ data: [] })),
}));

vi.mock('@app/features/gateway/api', () => ({
  getGatewayStatus: vi.fn(() => Promise.resolve({ data: {} })),
  createISCSIExport: vi.fn(() => Promise.resolve({})),
}));

vi.mock('@app/components/SizeInput', () => ({
  SizeInput: ({ defaultUnit, onChange, value }: any) => {
    const handleChange = (e: any) => {
      let inputValue: number;
      if (typeof e === 'number') {
        inputValue = e;
      } else if (e?.target?.value !== undefined) {
        inputValue = parseInt(e.target.value, 10) || 0;
      } else {
        inputValue = 0;
      }
      if (onChange) onChange(inputValue);
    };

    return (
      <input
        data-testid="size-input"
        data-unit={defaultUnit}
        type="number"
        defaultValue="1"
        value={value}
        onChange={handleChange}
      />
    );
  },
}));

// Import mocks first
import '../__mocks__';
import { resetFormValues } from '../__mocks__';

// Import after mocking
import { CreateISCSIForm } from '../CreateISCSIForm';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useResourceGroups } from '@app/features/resourceGroup';
import { createISCSIExport } from '@app/features/gateway/api';
import { notify } from '@app/utils/toast';

describe('CreateISCSIForm Component', () => {
  let mockNavigate: any;
  let mockMutation: any;
  let mockUseResourceGroups: any;

  beforeEach(() => {
    vi.clearAllMocks();
    resetFormValues();

    mockNavigate = vi.mocked(useNavigate);
    mockNavigate.mockReturnValue(vi.fn());

    mockMutation = vi.mocked(useMutation);
    mockMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    mockUseResourceGroups = vi.mocked(useResourceGroups);
    mockUseResourceGroups.mockReturnValue({ data: [] });
  });

  describe('Rendering', () => {
    it('should render the form', () => {
      render(<CreateISCSIForm />);

      expect(screen.getByTestId('form')).toBeInTheDocument();
    });

    it('should render info alert', () => {
      render(<CreateISCSIForm />);

      const alert = screen.getByTestId('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('data-type', 'info');
    });

    it('should render IQN input with Space.Compact', () => {
      render(<CreateISCSIForm />);

      expect(screen.getByTestId('space-compact')).toBeInTheDocument();
    });

    it('should render size input', () => {
      render(<CreateISCSIForm />);

      expect(screen.getByTestId('size-input')).toBeInTheDocument();
    });

    it('should render username and password fields', () => {
      render(<CreateISCSIForm />);

      const inputs = screen.getAllByTestId('input');
      // Should have username and password inputs
      expect(inputs.some((i) => i.getAttribute('placeholder') === 'CHAP username')).toBe(true);
    });

    it('should render gross size checkbox', () => {
      render(<CreateISCSIForm />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should render submit and cancel buttons', () => {
      render(<CreateISCSIForm />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.some((b) => b.textContent?.includes('common:submit'))).toBe(true);
      expect(buttons.some((b) => b.textContent?.includes('common:cancel'))).toBe(true);
    });
  });

  describe('IQN Input', () => {
    it('should have three input fields for IQN', () => {
      render(<CreateISCSIForm />);

      const inputs = screen.getAllByTestId('input');
      expect(inputs.length).toBeGreaterThanOrEqual(3);
    });

    it('should have proper placeholder for IQN inputs', () => {
      render(<CreateISCSIForm />);

      const inputs = screen.getAllByTestId('input');
      expect(inputs[0]).toHaveAttribute('placeholder', 'yyyy-mm');
      expect(inputs[1]).toHaveAttribute('placeholder', 'com.company');
      expect(inputs[2]).toHaveAttribute('placeholder', 'unique-name');
    });
  });

  describe('Service IPs List', () => {
    it('should render Form.List for service_ips', () => {
      render(<CreateISCSIForm />);

      expect(screen.getByTestId('form-list')).toBeInTheDocument();
    });

    it('should have add service IP button', () => {
      render(<CreateISCSIForm />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.some((b) => b.textContent?.includes('iscsi:add_service_ip'))).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should construct correct IQN format on submit', async () => {
      const mutateSpy = vi.fn();
      mockMutation.mockReturnValue({
        mutate: mutateSpy,
        isLoading: false,
      });

      render(<CreateISCSIForm />);

      const inputs = screen.getAllByTestId('input');
      const timeInput = inputs[0];
      const domainInput = inputs[1];
      const nameInput = inputs[2];
      const serviceIpInput = inputs[3];
      const sizeInput = screen.getByTestId('size-input');

      fireEvent.change(timeInput, { target: { value: '2024-01' } });
      fireEvent.change(domainInput, { target: { value: 'com.example' } });
      fireEvent.change(nameInput, { target: { value: 'target1' } });
      fireEvent.change(serviceIpInput, { target: { value: '192.168.1.1/24' } });
      fireEvent.change(sizeInput, { target: { value: 1073741824 } });

      const form = screen.getByTestId('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mutateSpy).toHaveBeenCalled();
      });

      const callArgs = mutateSpy.mock.calls[0][0];
      expect(callArgs.iqn).toBe('iqn.2024-01.com.example:target1');
    });

    it('should include service_ips array with main IP', async () => {
      const mutateSpy = vi.fn();
      mockMutation.mockReturnValue({
        mutate: mutateSpy,
        isLoading: false,
      });

      render(<CreateISCSIForm />);

      const inputs = screen.getAllByTestId('input');
      fireEvent.change(inputs[0], { target: { value: '2024-01' } });
      fireEvent.change(inputs[1], { target: { value: 'com.example' } });
      fireEvent.change(inputs[2], { target: { value: 'target1' } });
      fireEvent.change(inputs[3], { target: { value: '192.168.1.100/24' } });

      const form = screen.getByTestId('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mutateSpy).toHaveBeenCalled();
      });

      const callArgs = mutateSpy.mock.calls[0][0];
      expect(callArgs.service_ips).toContain('192.168.1.100/24');
    });

    it('should use default resource group when not provided', async () => {
      const mutateSpy = vi.fn();
      mockMutation.mockReturnValue({
        mutate: mutateSpy,
        isLoading: false,
      });

      render(<CreateISCSIForm />);

      const inputs = screen.getAllByTestId('input');
      fireEvent.change(inputs[0], { target: { value: '2024-01' } });
      fireEvent.change(inputs[1], { target: { value: 'com.example' } });
      fireEvent.change(inputs[2], { target: { value: 'target1' } });
      fireEvent.change(inputs[3], { target: { value: '192.168.1.1/24' } });

      const form = screen.getByTestId('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mutateSpy).toHaveBeenCalled();
      });

      const callArgs = mutateSpy.mock.calls[0][0];
      expect(callArgs.resource_group).toBe('DfltRscGrp');
    });

    it('should include volume with size_kib', async () => {
      const mutateSpy = vi.fn();
      mockMutation.mockReturnValue({
        mutate: mutateSpy,
        isLoading: false,
      });

      render(<CreateISCSIForm />);

      const inputs = screen.getAllByTestId('input');
      const sizeInput = screen.getByTestId('size-input');

      fireEvent.change(inputs[0], { target: { value: '2024-01' } });
      fireEvent.change(inputs[1], { target: { value: 'com.example' } });
      fireEvent.change(inputs[2], { target: { value: 'target1' } });
      fireEvent.change(inputs[3], { target: { value: '192.168.1.1/24' } });
      fireEvent.change(sizeInput, { target: { value: 2097152 } });

      const form = screen.getByTestId('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mutateSpy).toHaveBeenCalled();
      });

      const callArgs = mutateSpy.mock.calls[0][0];
      expect(callArgs.volumes).toEqual([{ number: 1, size_kib: 2097152 }]);
    });
  });

  describe('CHAP Authentication', () => {
    it('should include username and password in payload when provided', async () => {
      const mutateSpy = vi.fn();
      mockMutation.mockReturnValue({
        mutate: mutateSpy,
        isLoading: false,
      });

      render(<CreateISCSIForm />);

      const inputs = screen.getAllByTestId('input');
      const passwordInputs = screen.getAllByTestId('input-password');

      fireEvent.change(inputs[0], { target: { value: '2024-01' } });
      fireEvent.change(inputs[1], { target: { value: 'com.example' } });
      fireEvent.change(inputs[2], { target: { value: 'target1' } });
      fireEvent.change(inputs[3], { target: { value: '192.168.1.1/24' } });

      // Find username and password inputs
      const usernameInput = inputs.find((i) => i.getAttribute('placeholder') === 'CHAP username');
      fireEvent.change(usernameInput!, { target: { value: 'admin' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });

      const form = screen.getByTestId('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mutateSpy).toHaveBeenCalled();
      });

      const callArgs = mutateSpy.mock.calls[0][0];
      expect(callArgs.username).toBe('admin');
      expect(callArgs.password).toBe('password123');
    });

    it('should default to empty string for username and password when not provided', async () => {
      const mutateSpy = vi.fn();
      mockMutation.mockReturnValue({
        mutate: mutateSpy,
        isLoading: false,
      });

      render(<CreateISCSIForm />);

      const inputs = screen.getAllByTestId('input');
      fireEvent.change(inputs[0], { target: { value: '2024-01' } });
      fireEvent.change(inputs[1], { target: { value: 'com.example' } });
      fireEvent.change(inputs[2], { target: { value: 'target1' } });
      fireEvent.change(inputs[3], { target: { value: '192.168.1.1/24' } });

      const form = screen.getByTestId('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mutateSpy).toHaveBeenCalled();
      });

      const callArgs = mutateSpy.mock.calls[0][0];
      expect(callArgs.username).toBe('');
      expect(callArgs.password).toBe('');
    });
  });

  describe('Navigation', () => {
    it('should navigate to /gateway/iscsi on cancel', () => {
      const navigateSpy = vi.fn();
      mockNavigate.mockReturnValue(navigateSpy);

      render(<CreateISCSIForm />);

      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find((b) => b.textContent?.includes('common:cancel'));
      fireEvent.click(cancelButton!);

      expect(navigateSpy).toHaveBeenCalledWith('/gateway/iscsi');
    });
  });

  describe('Loading State', () => {
    it('should show loading state on submit button when creating', () => {
      mockMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: true,
      });

      render(<CreateISCSIForm />);

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find((b) => b.textContent?.includes('common:submit'));
      expect(submitButton).toHaveAttribute('data-loading', 'true');
    });
  });
});
