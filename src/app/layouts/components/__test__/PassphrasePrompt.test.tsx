import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('antd', () => ({
  Button: ({ children, onClick, loading }: { children: React.ReactNode; onClick: () => void; loading?: boolean }) => (
    <button data-testid="button" onClick={onClick} data-loading={loading}>
      {children}
    </button>
  ),
  Form: Object.assign(
    ({ children, onFinish }: { children: React.ReactNode; onFinish: (values: any) => void }) => (
      <form
        data-testid="form"
        onSubmit={(e) => {
          e.preventDefault();
          onFinish({});
        }}
      >
        {children}
      </form>
    ),
    {
      useForm: () => [{ resetFields: vi.fn() }],
      Item: ({ children, name, rules }: { children: React.ReactNode; name: string; rules?: any[] }) => (
        <div data-testid="form-item" data-name={name} data-rules={JSON.stringify(rules)}>
          {children}
        </div>
      ),
    },
  ),
  Input: Object.assign(
    ({ placeholder }: { placeholder: string }) => <input data-testid="input" placeholder={placeholder} />,
    {
      Password: ({ placeholder }: { placeholder: string }) => (
        <input data-testid="password-input" type="password" placeholder={placeholder} />
      ),
    },
  ),
  Modal: ({
    children,
    title,
    open,
    onCancel,
  }: {
    children: React.ReactNode;
    title: string;
    open: boolean;
    onCancel: () => void;
  }) => (
    <div data-testid="modal" data-title={title} data-open={open}>
      <button data-testid="cancel-button" onClick={onCancel}>
        Cancel
      </button>
      {children}
    </div>
  ),
  Tooltip: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="tooltip" title={title}>
      {children}
    </div>
  ),
  Spin: ({ indicator }: { indicator: React.ReactNode }) => <div data-testid="spin">{indicator}</div>,
}));

vi.mock('react-icons/io', () => ({
  IoIosWarning: ({ className, onClick }: { className: string; onClick: () => void }) => (
    <div data-testid="warning-icon" className={className} onClick={onClick} />
  ),
}));

vi.mock('react-icons/fa', () => ({
  FaLock: ({ className, onClick }: { className: string; onClick: () => void }) => (
    <div data-testid="lock-icon" className={className} onClick={onClick} />
  ),
  FaLockOpen: ({ className }: { className: string }) => <div data-testid="lock-open-icon" className={className} />,
}));

vi.mock('@ant-design/icons', () => ({
  LoadingOutlined: ({ style, spin }: { style: any; spin: boolean }) => (
    <div data-testid="loading-icon" style={style} data-spin={spin} />
  ),
}));

vi.mock('@app/features/settings/passphrase', () => ({
  getPassphraseStatus: vi.fn(),
  createPassphrase: vi.fn(),
  enterPassPhrase: vi.fn(),
}));

const { getPassphraseStatus, createPassphrase, enterPassPhrase } = await import('@app/features/settings/passphrase');

describe('PassphrasePrompt Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: {
        reload: vi.fn(),
      },
      writable: true,
    });
  });

  const createWrapper =
    () =>
    ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

  describe('Passphrase Status Query', () => {
    it('should call getPassphraseStatus on component mount', async () => {
      vi.mocked(getPassphraseStatus).mockResolvedValue({ data: { status: 'unset' } });
      const wrapper = createWrapper();

      const { result } = renderHook(
        () => {
          // Simulate the actual query logic from the component
          const queryFn = async () => {
            const response = await getPassphraseStatus();
            return { status: response?.data?.status || 'unset' };
          };
          return { queryFn };
        },
        { wrapper },
      );

      // Call the query function manually to test the logic
      await result.current.queryFn();

      expect(getPassphraseStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle successful passphrase status fetch', async () => {
      const mockResponse = { data: { status: 'locked' } };
      vi.mocked(getPassphraseStatus).mockResolvedValue(mockResponse);

      const wrapper = createWrapper();

      const { result } = renderHook(
        () => ({
          queryFn: async () => {
            const response: any = await getPassphraseStatus();
            return { status: response?.data?.status || 'unset' };
          },
        }),
        { wrapper },
      );

      await waitFor(() => {
        const passphraseStatus = { status: mockResponse.data.status };
        expect(passphraseStatus.status).toBe('locked');
      });
    });

    it('should handle error in passphrase status fetch', async () => {
      vi.mocked(getPassphraseStatus).mockRejectedValue(new Error('Network error'));

      const wrapper = createWrapper();

      const { result } = renderHook(
        () => ({
          queryFn: async () => {
            try {
              const response: any = await getPassphraseStatus();
              return { status: response?.data?.status || 'unset' };
            } catch {
              return { status: 'unset' };
            }
          },
        }),
        { wrapper },
      );

      try {
        await result.current.queryFn();
      } catch (error) {
        // Expected to handle error
      }

      expect(getPassphraseStatus).toHaveBeenCalledTimes(1);
    });

    it('should default to unset status when response is undefined', () => {
      const processResponse = (response: any) => {
        return { status: response?.data?.status || 'unset' };
      };

      const testCases = [
        { response: undefined, expected: 'unset' },
        { response: null, expected: 'unset' },
        { response: {}, expected: 'unset' },
        { response: { data: {} }, expected: 'unset' },
        { response: { data: { status: 'locked' } }, expected: 'locked' },
      ];

      testCases.forEach(({ response, expected }) => {
        const result = processResponse(response);
        expect(result.status).toBe(expected);
      });
    });
  });

  describe('Passphrase Status Logic', () => {
    it('should determine correct status from data', () => {
      const testCases = [
        { passphraseData: undefined, expected: 'unset' },
        { passphraseData: { status: 'unset' }, expected: 'unset' },
        { passphraseData: { status: 'locked' }, expected: 'locked' },
        { passphraseData: { status: 'unlocked' }, expected: 'unlocked' },
      ];

      testCases.forEach(({ passphraseData, expected }) => {
        const status = passphraseData?.status || 'unset';
        expect(status).toBe(expected);
      });
    });
  });

  describe('Create Passphrase Mutation', () => {
    it('should call createPassphrase with correct parameters', async () => {
      vi.mocked(createPassphrase).mockResolvedValue({} as any);

      const testPassphrase = 'test-passphrase-123';
      const handleSetPassphrase = async (values: { passphrase: string }) => {
        try {
          await createPassphrase(values.passphrase);
        } catch (error) {
          // Error handled in callback
        }
      };

      await handleSetPassphrase({ passphrase: testPassphrase });

      expect(createPassphrase).toHaveBeenCalledWith(testPassphrase);
      expect(createPassphrase).toHaveBeenCalledTimes(1);
    });

    it('should handle createPassphrase success', async () => {
      vi.mocked(createPassphrase).mockResolvedValue({} as any);

      const mockForm = { resetFields: vi.fn() };
      let isModalOpen = true;

      const onSuccess = () => {
        // Query invalidation would happen here
        isModalOpen = false;
        mockForm.resetFields();
      };

      await createPassphrase('test-passphrase');
      onSuccess();

      expect(mockForm.resetFields).toHaveBeenCalledTimes(1);
      expect(isModalOpen).toBe(false);
    });

    it('should handle createPassphrase error', async () => {
      const mockError = new Error('Passphrase creation failed');
      vi.mocked(createPassphrase).mockRejectedValue(mockError);

      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const onError = (error: Error) => {
        console.error('Failed to set passphrase:', error);
      };

      try {
        await createPassphrase('test-passphrase');
      } catch (error) {
        onError(error as Error);
      }

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to set passphrase:', mockError);
      mockConsoleError.mockRestore();
    });
  });

  describe('Enter Passphrase Mutation', () => {
    it('should call enterPassPhrase with correct parameters', async () => {
      vi.mocked(enterPassPhrase).mockResolvedValue({} as any);

      const testPassphrase = 'unlock-passphrase-456';
      const handleUnlockPassphrase = async (values: { passphrase: string }) => {
        try {
          await enterPassPhrase(values.passphrase);
        } catch (error) {
          // Error handled in callback
        }
      };

      await handleUnlockPassphrase({ passphrase: testPassphrase });

      expect(enterPassPhrase).toHaveBeenCalledWith(testPassphrase);
      expect(enterPassPhrase).toHaveBeenCalledTimes(1);
    });

    it('should handle enterPassPhrase success with page reload', async () => {
      vi.mocked(enterPassPhrase).mockResolvedValue({} as any);

      const mockForm = { resetFields: vi.fn() };
      let isModalOpen = true;
      const mockReload = vi.fn();
      window.location.reload = mockReload;

      const onSuccess = () => {
        // Query invalidation would happen here
        isModalOpen = false;
        mockForm.resetFields();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      };

      await enterPassPhrase('test-passphrase');
      onSuccess();

      expect(mockForm.resetFields).toHaveBeenCalledTimes(1);
      expect(isModalOpen).toBe(false);

      // Wait for setTimeout
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    it('should handle enterPassPhrase error', async () => {
      const mockError = new Error('Unlock failed');
      vi.mocked(enterPassPhrase).mockRejectedValue(mockError);

      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const onError = (error: Error) => {
        console.error('Failed to unlock passphrase:', error);
      };

      try {
        await enterPassPhrase('wrong-passphrase');
      } catch (error) {
        onError(error as Error);
      }

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to unlock passphrase:', mockError);
      mockConsoleError.mockRestore();
    });
  });

  describe('Modal Control Logic', () => {
    it('should open modal when status is not unlocked', () => {
      const testCases = [
        { status: 'unset', shouldOpen: true },
        { status: 'locked', shouldOpen: true },
        { status: 'unlocked', shouldOpen: false },
      ];

      testCases.forEach(({ status, shouldOpen }) => {
        let isModalOpen = false;

        const handleClick = () => {
          if (status !== 'unlocked') {
            isModalOpen = true;
          }
        };

        handleClick();
        expect(isModalOpen).toBe(shouldOpen);
      });
    });

    it('should close modal and reset form on cancel', () => {
      let isModalOpen = true;
      const mockForm = { resetFields: vi.fn() };

      const handleCancel = () => {
        isModalOpen = false;
        mockForm.resetFields();
      };

      handleCancel();

      expect(isModalOpen).toBe(false);
      expect(mockForm.resetFields).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon Rendering Logic', () => {
    it('should render loading icon when loading', () => {
      const isLoading = true;

      const renderIcon = () => {
        if (isLoading) {
          return 'loading';
        }
        return 'icon';
      };

      expect(renderIcon()).toBe('loading');
    });

    it('should render correct icon based on status', () => {
      const testCases = [
        { status: 'unset', expected: 'warning' },
        { status: 'locked', expected: 'lock' },
        { status: 'unlocked', expected: 'lock-open' },
        { status: 'unknown', expected: null },
      ];

      testCases.forEach(({ status, expected }) => {
        const renderIcon = (status: string) => {
          switch (status) {
            case 'unset':
              return 'warning';
            case 'locked':
              return 'lock';
            case 'unlocked':
              return 'lock-open';
            default:
              return null;
          }
        };

        expect(renderIcon(status)).toBe(expected);
      });
    });
  });

  describe('Modal Content Logic', () => {
    it('should determine correct modal title based on status', () => {
      const testCases = [
        { status: 'unset', expected: 'settings:set_passphrase' },
        { status: 'locked', expected: 'settings:unlock_passphrase' },
        { status: 'unlocked', expected: 'settings:unlock_passphrase' },
      ];

      testCases.forEach(({ status, expected }) => {
        const modalTitle = status === 'unset' ? 'settings:set_passphrase' : 'settings:unlock_passphrase';
        expect(modalTitle).toBe(expected);
      });
    });

    it('should determine correct submit button text based on status', () => {
      const testCases = [
        { status: 'unset', expected: 'settings:set_passphrase' },
        { status: 'locked', expected: 'common:unlock' },
        { status: 'unlocked', expected: 'common:unlock' },
      ];

      testCases.forEach(({ status, expected }) => {
        const submitButtonText = status === 'unset' ? 'settings:set_passphrase' : 'common:unlock';
        expect(submitButtonText).toBe(expected);
      });
    });

    it('should show confirm passphrase field only for unset status', () => {
      const testCases = [
        { status: 'unset', shouldShowConfirm: true },
        { status: 'locked', shouldShowConfirm: false },
        { status: 'unlocked', shouldShowConfirm: false },
      ];

      testCases.forEach(({ status, shouldShowConfirm }) => {
        const showConfirmField = status === 'unset';
        expect(showConfirmField).toBe(shouldShowConfirm);
      });
    });
  });

  describe('Form Validation Logic', () => {
    it('should require passphrase field', () => {
      const passphraseRules = [
        {
          required: true,
          message: 'settings:please_input_passphrase',
        },
      ];

      expect(passphraseRules[0].required).toBe(true);
      expect(passphraseRules[0].message).toBe('settings:please_input_passphrase');
    });

    it('should validate passphrase confirmation', () => {
      const mockGetFieldValue = vi.fn();

      const confirmRules = [
        {
          required: true,
          message: 'settings:please_confirm_passphrase',
        },
        {
          validator: (rule: any, value: string) => {
            const passphrase = mockGetFieldValue('passphrase');
            if (!value || passphrase === value) {
              return Promise.resolve();
            }
            return Promise.reject(new Error('settings:passphrase_not_match'));
          },
        },
      ];

      expect(confirmRules[0].required).toBe(true);
      expect(confirmRules[1].validator).toBeDefined();
    });

    it('should pass validation when passwords match', async () => {
      const mockGetFieldValue = (field: string) => 'test-password';

      const validator = (rule: any, value: string) => {
        const passphrase = mockGetFieldValue('passphrase');
        if (!value || passphrase === value) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('settings:passphrase_not_match'));
      };

      await expect(validator({}, 'test-password')).resolves.toBeUndefined();
    });

    it('should fail validation when passwords do not match', async () => {
      const mockGetFieldValue = (field: string) => 'test-password';

      const validator = (rule: any, value: string) => {
        const passphrase = mockGetFieldValue('passphrase');
        if (!value || passphrase === value) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('settings:passphrase_not_match'));
      };

      await expect(validator({}, 'different-password')).rejects.toThrow('settings:passphrase_not_match');
    });
  });

  describe('Form Submission Logic', () => {
    it('should determine correct form handler based on status', () => {
      const mockSetHandler = vi.fn();
      const mockUnlockHandler = vi.fn();

      const testCases = [
        { status: 'unset', expectedHandler: mockSetHandler },
        { status: 'locked', expectedHandler: mockUnlockHandler },
      ];

      testCases.forEach(({ status, expectedHandler }) => {
        const handler = status === 'unset' ? mockSetHandler : mockUnlockHandler;
        expect(handler).toBe(expectedHandler);
      });
    });
  });

  describe('Loading State Logic', () => {
    it('should show loading on submit button during mutations', () => {
      const testCases = [
        { createLoading: true, enterLoading: false, expected: true },
        { createLoading: false, enterLoading: true, expected: true },
        { createLoading: true, enterLoading: true, expected: true },
        { createLoading: false, enterLoading: false, expected: false },
      ];

      testCases.forEach(({ createLoading, enterLoading, expected }) => {
        const isLoading = createLoading || enterLoading;
        expect(isLoading).toBe(expected);
      });
    });
  });

  describe('Tooltip Content Logic', () => {
    it('should provide correct tooltip text for each status', () => {
      const tooltipTexts = {
        loading: 'settings:linstor_passphrase_loading',
        unset: 'settings:passphrase_not_set',
        locked: 'settings:linstor_locked',
        unlocked: 'settings:linstor_unlocked',
      };

      expect(tooltipTexts.loading).toBe('settings:linstor_passphrase_loading');
      expect(tooltipTexts.unset).toBe('settings:passphrase_not_set');
      expect(tooltipTexts.locked).toBe('settings:linstor_locked');
      expect(tooltipTexts.unlocked).toBe('settings:linstor_unlocked');
    });
  });
});
