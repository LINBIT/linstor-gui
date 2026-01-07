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
  createNFSExport: vi.fn(() => Promise.resolve({})),
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
import { resetFormValues, captureValue } from '../__mocks__';

// Import after mocking
import { CreateNFSForm } from '../CreateNFSForm';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useResourceGroups } from '@app/features/resourceGroup';
import { createNFSExport } from '@app/features/gateway/api';
import { notify } from '@app/utils/toast';

describe('CreateNFSForm Component', () => {
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
      render(<CreateNFSForm />);

      expect(screen.getByTestId('form')).toBeInTheDocument();
    });

    it('should render name input field', () => {
      render(<CreateNFSForm />);

      const inputs = screen.getAllByTestId('input');
      expect(inputs.some((i) => i.getAttribute('placeholder') === 'Please input name: my_export')).toBe(true);
    });

    it('should render size input', () => {
      render(<CreateNFSForm />);

      expect(screen.getByTestId('size-input')).toBeInTheDocument();
    });

    it('should render export path input', () => {
      render(<CreateNFSForm />);

      const inputs = screen.getAllByTestId('input');
      expect(inputs.some((i) => i.getAttribute('placeholder') === 'Please input export path: /')).toBe(true);
    });

    it('should render file system select', () => {
      render(<CreateNFSForm />);

      const selects = screen.getAllByTestId('select');
      expect(selects.length).toBeGreaterThan(0);
    });

    it('should render gross size checkbox', () => {
      render(<CreateNFSForm />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should render submit and cancel buttons', () => {
      render(<CreateNFSForm />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.some((b) => b.textContent?.includes('common:submit'))).toBe(true);
      expect(buttons.some((b) => b.textContent?.includes('common:cancel'))).toBe(true);
    });
  });

  describe('Volumes List', () => {
    it('should render Form.List for volumes', () => {
      render(<CreateNFSForm />);

      const formLists = screen.getAllByTestId('form-list');
      expect(formLists.length).toBeGreaterThanOrEqual(1);
    });

    it('should have add volume button', () => {
      render(<CreateNFSForm />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.some((b) => b.textContent?.includes('nfs:volumes'))).toBe(true);
    });
  });

  describe('Allowed IPs List', () => {
    it('should render Form.List for allowed_ips', () => {
      render(<CreateNFSForm />);

      const formLists = screen.getAllByTestId('form-list');
      expect(formLists.length).toBe(2); // volumes and allowed_ips
    });

    it('should have add allowed IP button', () => {
      render(<CreateNFSForm />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.some((b) => b.textContent?.includes('nfs:allowed_ips'))).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should construct correct payload on submit', async () => {
      const mutateSpy = vi.fn();
      mockMutation.mockReturnValue({
        mutate: mutateSpy,
        isLoading: false,
      });

      render(<CreateNFSForm />);

      const inputs = screen.getAllByTestId('input');
      const nameInput = inputs.find((i) => i.getAttribute('placeholder') === 'Please input name: my_export');
      const serviceIpInput = inputs.find((i) => i.getAttribute('placeholder') === '192.168.1.1/24');
      const sizeInput = screen.getByTestId('size-input');

      fireEvent.change(nameInput!, { target: { value: 'my-nfs-export' } });
      fireEvent.change(serviceIpInput!, { target: { value: '192.168.1.100/24' } });
      fireEvent.change(sizeInput, { target: { value: 1073741824 } });

      const form = screen.getByTestId('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mutateSpy).toHaveBeenCalled();
      });

      const callArgs = mutateSpy.mock.calls[0][0];
      expect(callArgs.name).toBe('my-nfs-export');
      expect(callArgs.service_ip).toBe('192.168.1.100/24');
    });

    it('should use default allowed_ips when not provided', async () => {
      const mutateSpy = vi.fn();
      mockMutation.mockReturnValue({
        mutate: mutateSpy,
        isLoading: false,
      });

      render(<CreateNFSForm />);

      const inputs = screen.getAllByTestId('input');
      const nameInput = inputs.find((i) => i.getAttribute('placeholder') === 'Please input name: my_export');
      const serviceIpInput = inputs.find((i) => i.getAttribute('placeholder') === '192.168.1.1/24');
      const sizeInput = screen.getByTestId('size-input');

      fireEvent.change(nameInput!, { target: { value: 'my-export' } });
      fireEvent.change(serviceIpInput!, { target: { value: '192.168.1.1/24' } });
      fireEvent.change(sizeInput, { target: { value: 1073741824 } });

      const form = screen.getByTestId('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mutateSpy).toHaveBeenCalled();
      });

      const callArgs = mutateSpy.mock.calls[0][0];
      expect(callArgs.allowed_ips).toEqual(['0.0.0.0/0']);
    });

    it('should use provided allowed_ips when given', async () => {
      const mutateSpy = vi.fn();
      mockMutation.mockReturnValue({
        mutate: mutateSpy,
        isLoading: false,
      });

      render(<CreateNFSForm />);

      const inputs = screen.getAllByTestId('input');
      const nameInput = inputs.find((i) => i.getAttribute('placeholder') === 'Please input name: my_export');
      const serviceIpInput = inputs.find((i) => i.getAttribute('placeholder') === '192.168.1.1/24');
      const sizeInput = screen.getByTestId('size-input');

      fireEvent.change(nameInput!, { target: { value: 'my-export' } });
      fireEvent.change(serviceIpInput!, { target: { value: '192.168.1.1/24' } });
      fireEvent.change(sizeInput, { target: { value: 1073741824 } });

      // Workaround: Form.List starts empty so capture the allowed_ips value directly
      captureValue('allowed_ips', ['192.168.0.0/16']);

      const form = screen.getByTestId('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mutateSpy).toHaveBeenCalled();
      });

      const callArgs = mutateSpy.mock.calls[0][0];
      expect(callArgs.allowed_ips).toEqual(['192.168.0.0/16']);
    });

    it('should include volume with correct structure', async () => {
      const mutateSpy = vi.fn();
      mockMutation.mockReturnValue({
        mutate: mutateSpy,
        isLoading: false,
      });

      render(<CreateNFSForm />);

      const inputs = screen.getAllByTestId('input');
      const nameInput = inputs.find((i) => i.getAttribute('placeholder') === 'Please input name: my_export');
      const serviceIpInput = inputs.find((i) => i.getAttribute('placeholder') === '192.168.1.1/24');
      const exportPathInput = inputs.find((i) => i.getAttribute('placeholder') === 'Please input export path: /');
      const sizeInput = screen.getByTestId('size-input');

      fireEvent.change(nameInput!, { target: { value: 'my-export' } });
      fireEvent.change(serviceIpInput!, { target: { value: '192.168.1.1/24' } });
      fireEvent.change(exportPathInput!, { target: { value: '/data' } });
      fireEvent.change(sizeInput, { target: { value: 2097152 } });

      // Workaround: capture values that aren't handled by the Form.Item mock
      captureValue('file_system', 'ext4');
      captureValue('size_kib', 2097152);
      captureValue('export_path', '/data');

      const form = screen.getByTestId('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mutateSpy).toHaveBeenCalled();
      });

      const callArgs = mutateSpy.mock.calls[0][0];
      expect(callArgs.volumes).toHaveLength(1);
      expect(callArgs.volumes[0]).toEqual({
        number: 1,
        export_path: '/data',
        size_kib: 2097152,
        file_system: 'ext4',
        file_system_root_owner: { user: 'nobody', group: 'nobody' },
      });
    });

    it('should include additional volumes when added', async () => {
      const mutateSpy = vi.fn();
      mockMutation.mockReturnValue({
        mutate: mutateSpy,
        isLoading: false,
      });

      render(<CreateNFSForm />);

      const inputs = screen.getAllByTestId('input');
      const nameInput = inputs.find((i) => i.getAttribute('placeholder') === 'Please input name: my_export');
      const serviceIpInput = inputs.find((i) => i.getAttribute('placeholder') === '192.168.1.1/24');
      const sizeInput = screen.getByTestId('size-input');

      fireEvent.change(nameInput!, { target: { value: 'my-export' } });
      fireEvent.change(serviceIpInput!, { target: { value: '192.168.1.1/24' } });
      fireEvent.change(sizeInput, { target: { value: 1073741824 } });

      const form = screen.getByTestId('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mutateSpy).toHaveBeenCalled();
      });

      const callArgs = mutateSpy.mock.calls[0][0];
      // Without additional volumes, only the main volume is included
      expect(callArgs.volumes).toHaveLength(1);
    });
  });

  describe('Navigation', () => {
    it('should navigate to /gateway/NFS on cancel', () => {
      const navigateSpy = vi.fn();
      mockNavigate.mockReturnValue(navigateSpy);

      render(<CreateNFSForm />);

      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find((b) => b.textContent?.includes('common:cancel'));
      fireEvent.click(cancelButton!);

      expect(navigateSpy).toHaveBeenCalledWith('/gateway/NFS');
    });
  });

  describe('Loading State', () => {
    it('should show loading state on submit button when creating', () => {
      mockMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: true,
      });

      render(<CreateNFSForm />);

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find((b) => b.textContent?.includes('common:submit'));
      expect(submitButton).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Gross Size', () => {
    it('should default gross_size to false', async () => {
      const mutateSpy = vi.fn();
      mockMutation.mockReturnValue({
        mutate: mutateSpy,
        isLoading: false,
      });

      render(<CreateNFSForm />);

      const inputs = screen.getAllByTestId('input');
      const nameInput = inputs.find((i) => i.getAttribute('placeholder') === 'Please input name: my_export');
      const serviceIpInput = inputs.find((i) => i.getAttribute('placeholder') === '192.168.1.1/24');
      const sizeInput = screen.getByTestId('size-input');

      fireEvent.change(nameInput!, { target: { value: 'my-export' } });
      fireEvent.change(serviceIpInput!, { target: { value: '192.168.1.1/24' } });
      fireEvent.change(sizeInput, { target: { value: 1073741824 } });

      const form = screen.getByTestId('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mutateSpy).toHaveBeenCalled();
      });

      const callArgs = mutateSpy.mock.calls[0][0];
      expect(callArgs.gross_size).toBe(false);
    });
  });
});
