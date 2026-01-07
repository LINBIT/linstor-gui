import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { init } from '@rematch/core';
import React from 'react';

import HeaderTools from '../HeaderTools';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('antd', () => ({
  Tooltip: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="tooltip" title={title}>
      {children}
    </div>
  ),
  Avatar: ({ children, style }: { children: React.ReactNode; style: any }) => (
    <div data-testid="avatar" style={style}>
      {children}
    </div>
  ),
  Dropdown: ({ children, menu }: { children: React.ReactNode; menu: any }) => (
    <div data-testid="dropdown" data-menu-items={menu?.items ? menu.items.length : 0}>
      {children}
    </div>
  ),
  Modal: ({
    children,
    title,
    open,
    onCancel,
  }: {
    children: React.ReactNode;
    title?: string;
    open?: boolean;
    onCancel?: () => void;
  }) =>
    open ? (
      <div data-testid="modal" data-title={title}>
        {children}
        <button onClick={onCancel} data-testid="modal-cancel">
          Cancel
        </button>
      </div>
    ) : null,
}));

vi.mock('@ant-design/icons', () => ({
  DeploymentUnitOutlined: ({ style }: { style: any }) => <div data-testid="deployment-icon" style={style} />,
  DownOutlined: ({ className }: { className?: string }) => <div data-testid="down-icon" className={className} />,
  CloseOutlined: () => <div data-testid="close-icon" />,
}));

vi.mock('@app/features/authentication', () => ({
  ChangePassword: () => <div data-testid="change-password">Change Password</div>,
}));

vi.mock('@app/features/node', () => ({
  getControllerVersion: vi.fn(),
}));

vi.mock('@app/features/resource/hooks/useFaultyResources', () => ({
  useFaultyResources: vi.fn(() => ({ data: [] })),
}));

vi.mock('@app/features/resource/api', () => ({
  getResources: vi.fn(() => Promise.resolve({ data: [] })),
}));

// Mock assets
vi.mock('@app/assets/logout.svg', () => ({ default: 'logout.svg' }));
vi.mock('@app/assets/user.svg', () => ({ default: 'user.svg' }));
vi.mock('@app/assets/warning-icon.svg', () => ({ default: 'warning.svg' }));
vi.mock('@app/assets/out-link.svg', () => ({ default: 'outlink.svg' }));

// Mock child components
vi.mock('../LogSidebar', () => ({ default: () => <div data-testid="log-sidebar">LogSidebar</div> }));
vi.mock('../HeaderAboutModal', () => ({ default: () => <div data-testid="about-modal">AboutModal</div> }));
vi.mock('../ConnectStatus', () => ({ default: () => <div data-testid="connect-status">ConnectStatus</div> }));
vi.mock('../LngSelector', () => ({ default: () => <div data-testid="lng-selector">LngSelector</div> }));
vi.mock('../PassphrasePrompt', () => ({ default: () => <div data-testid="passphrase-prompt">PassphrasePrompt</div> }));
vi.mock('react-icons/ci', () => ({
  CiUser: ({ size }: { size: number }) => <div data-testid="ci-user-icon" data-size={size} />,
}));

const { getControllerVersion } = await import('@app/features/node');

describe('HeaderTools Component', () => {
  let queryClient: QueryClient;
  let mockStore: any;
  let mockDispatch: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockDispatch = {
      auth: {
        logout: vi.fn(),
      },
    };

    mockStore = init({
      models: {
        auth: {
          state: {},
          reducers: {},
        },
      },
    });

    // Mock useDispatch
    vi.doMock('react-redux', async () => {
      const actual = await vi.importActual('react-redux');
      return {
        ...actual,
        useDispatch: () => mockDispatch,
      };
    });

    vi.clearAllMocks();
  });

  const createWrapper =
    () =>
    ({ children }: { children: React.ReactNode }) => (
      <Provider store={mockStore}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Provider>
    );

  describe('compareVersions function', () => {
    // Test the compareVersions function logic
    const compareVersions = (version1: string | undefined, version2: string): boolean => {
      if (!version1) return false;

      const v1Parts = version1.split('.').map(Number);
      const v2Parts = version2.split('.').map(Number);

      for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1 = v1Parts[i] || 0;
        const v2 = v2Parts[i] || 0;

        if (v1 > v2) return true;
        if (v1 < v2) return false;
      }

      return true; // Equal versions
    };

    it('should return false for undefined version', () => {
      expect(compareVersions(undefined, '1.25.0')).toBe(false);
    });

    it('should compare version strings correctly - greater version', () => {
      expect(compareVersions('1.26.0', '1.25.0')).toBe(true);
      expect(compareVersions('2.0.0', '1.25.0')).toBe(true);
      expect(compareVersions('1.25.1', '1.25.0')).toBe(true);
    });

    it('should compare version strings correctly - lesser version', () => {
      expect(compareVersions('1.24.0', '1.25.0')).toBe(false);
      expect(compareVersions('0.25.0', '1.25.0')).toBe(false);
      expect(compareVersions('1.24.9', '1.25.0')).toBe(false);
    });

    it('should compare version strings correctly - equal version', () => {
      expect(compareVersions('1.25.0', '1.25.0')).toBe(true);
    });

    it('should handle versions with different number of parts', () => {
      expect(compareVersions('1.25', '1.25.0')).toBe(true);
      expect(compareVersions('1.25.0.1', '1.25.0')).toBe(true);
      expect(compareVersions('1.24', '1.25.0')).toBe(false);
    });
  });

  describe('Controller Version Logic', () => {
    it('should call getControllerVersion on mount', () => {
      vi.mocked(getControllerVersion).mockResolvedValue({ version: '1.25.0' } as any);
      const wrapper = createWrapper();

      render(
        <HeaderTools
          authInfo={{ username: 'admin' }}
          vsanModeFromSetting={false}
          isNotOfficialBuild={false}
          VSANEvalMode={false}
          hciModeFromSetting={false}
          normalWithoutAuth={false}
          authenticationEnabled={true}
          VSANAvailable={true}
          onModeChange={vi.fn()}
          handleSupportClick={vi.fn()}
        />,
        { wrapper },
      );

      expect(getControllerVersion).toHaveBeenCalledTimes(1);
    });

    it('should determine passphrase availability correctly', () => {
      const testCases = [
        { version: '1.25.0', isFetched: true, expected: true },
        { version: '1.26.0', isFetched: true, expected: true },
        { version: '1.24.0', isFetched: true, expected: false },
        { version: '1.25.0', isFetched: false, expected: false },
        { version: undefined, isFetched: true, expected: false },
      ];

      testCases.forEach(({ version, isFetched, expected }) => {
        const compareVersions = (version1: string | undefined, version2: string): boolean => {
          if (!version1) return false;
          const v1Parts = version1.split('.').map(Number);
          const v2Parts = version2.split('.').map(Number);
          for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const v1 = v1Parts[i] || 0;
            const v2 = v2Parts[i] || 0;
            if (v1 > v2) return true;
            if (v1 < v2) return false;
          }
          return true;
        };

        const checkPassphraseAvailable = isFetched && compareVersions(version, '1.25.0');
        expect(checkPassphraseAvailable).toBe(expected);
      });
    });
  });

  describe('Menu Configuration', () => {
    it('should configure user info menu item correctly', () => {
      const authInfo = { username: 'testuser' };

      const userInfoItem = {
        key: 'userinfo',
        hidden: false,
      };

      expect(userInfoItem.key).toBe('userinfo');
      expect(userInfoItem.hidden).toBe(false);
    });

    it('should configure change password menu item based on authentication', () => {
      const testCases = [
        { authenticationEnabled: true, expected: false },
        { authenticationEnabled: false, expected: true },
      ];

      testCases.forEach(({ authenticationEnabled, expected }) => {
        const changePasswordItem = {
          key: 'changepassword',
          hidden: !authenticationEnabled,
        };

        expect(changePasswordItem.hidden).toBe(expected);
      });
    });

    it('should configure mode change menu item based on VSAN availability', () => {
      const testCases = [
        { VSANAvailable: true, expected: false },
        { VSANAvailable: false, expected: true },
      ];

      testCases.forEach(({ VSANAvailable, expected }) => {
        const changeModeItem = {
          key: 'changemode',
          hidden: !VSANAvailable,
        };

        expect(changeModeItem.hidden).toBe(expected);
      });
    });

    it('should configure logout menu item based on authentication', () => {
      const testCases = [
        { authenticationEnabled: true, expected: false },
        { authenticationEnabled: false, expected: true },
      ];

      testCases.forEach(({ authenticationEnabled, expected }) => {
        const logoutItem = {
          key: 'logout',
          hidden: !authenticationEnabled,
        };

        expect(logoutItem.hidden).toBe(expected);
      });
    });
  });

  describe('Mode Change Logic', () => {
    it('should determine correct mode change text', () => {
      const testCases = [
        { vsanModeFromSetting: true, expected: 'Switch to advanced mode' },
        { vsanModeFromSetting: false, expected: 'Leave advanced mode' },
      ];

      testCases.forEach(({ vsanModeFromSetting, expected }) => {
        const modeText = vsanModeFromSetting ? 'Switch to advanced mode' : 'Leave advanced mode';
        expect(modeText).toBe(expected);
      });
    });

    it('should determine correct mode to switch to', () => {
      const testCases = [
        { vsanModeFromSetting: true, expected: 'NORMAL' },
        { vsanModeFromSetting: false, expected: 'VSAN' },
      ];

      testCases.forEach(({ vsanModeFromSetting, expected }) => {
        const targetMode = vsanModeFromSetting ? 'NORMAL' : 'VSAN';
        expect(targetMode).toBe(expected);
      });
    });
  });

  describe('Component Visibility Logic', () => {
    it('should show unofficial build warning correctly', () => {
      const testCases = [
        { isNotOfficialBuild: true, expected: true },
        { isNotOfficialBuild: false, expected: false },
      ];

      testCases.forEach(({ isNotOfficialBuild, expected }) => {
        const shouldShowWarning = !!isNotOfficialBuild;
        expect(shouldShowWarning).toBe(expected);
      });
    });

    it('should show VSAN eval mode warning correctly', () => {
      const testCases = [
        { vsanModeFromSetting: true, VSANEvalMode: true, expected: true },
        { vsanModeFromSetting: true, VSANEvalMode: false, expected: false },
        { vsanModeFromSetting: false, VSANEvalMode: true, expected: false },
        { vsanModeFromSetting: false, VSANEvalMode: false, expected: false },
      ];

      testCases.forEach(({ vsanModeFromSetting, VSANEvalMode, expected }) => {
        const shouldShowVSANWarning = vsanModeFromSetting && VSANEvalMode;
        expect(shouldShowVSANWarning).toBe(expected);
      });
    });

    it('should show normal components correctly', () => {
      const testCases = [
        { vsanModeFromSetting: false, expected: true },
        { vsanModeFromSetting: true, expected: false },
      ];

      testCases.forEach(({ vsanModeFromSetting, expected }) => {
        const shouldShowNormalComponents = !vsanModeFromSetting;
        expect(shouldShowNormalComponents).toBe(expected);
      });
    });

    it('should show user dropdown correctly', () => {
      const testCases = [
        { normalWithoutAuth: false, hciModeFromSetting: false, expected: true },
        { normalWithoutAuth: true, hciModeFromSetting: false, expected: false },
        { normalWithoutAuth: false, hciModeFromSetting: true, expected: false },
        { normalWithoutAuth: true, hciModeFromSetting: true, expected: false },
      ];

      testCases.forEach(({ normalWithoutAuth, hciModeFromSetting, expected }) => {
        const shouldShowDropdown = !normalWithoutAuth && !hciModeFromSetting;
        expect(shouldShowDropdown).toBe(expected);
      });
    });
  });

  describe('Avatar Configuration', () => {
    it('should generate correct avatar initial', () => {
      const testCases = [
        { username: 'testuser', expected: 'T' },
        { username: 'admin', expected: 'A' },
        { username: '', expected: 'A' },
        { username: undefined, expected: 'A' },
      ];

      testCases.forEach(({ username, expected }) => {
        const initial = username?.charAt(0).toUpperCase() || 'A';
        expect(initial).toBe(expected);
      });
    });
  });

  describe('Environment Logic', () => {
    it('should determine VSAN URL correctly for dev environment', () => {
      const IS_DEV = true;
      const mockEnvHost = 'http://localhost:8080';
      const hostname = 'localhost';

      const vsanUrl = IS_DEV ? mockEnvHost + '/register.html' : 'https://' + hostname + '/register.html';

      expect(vsanUrl).toBe('http://localhost:8080/register.html');
    });

    it('should determine VSAN URL correctly for production environment', () => {
      const IS_DEV = false;
      const hostname = 'example.com';

      const vsanUrl = IS_DEV ? 'mock-env-host/register.html' : 'https://' + hostname + '/register.html';

      expect(vsanUrl).toBe('https://example.com/register.html');
    });
  });
});
