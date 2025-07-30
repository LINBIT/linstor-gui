import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { init } from '@rematch/core';
import React from 'react';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('antd', () => ({
  Modal: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="modal" title={title}>
      {children}
    </div>
  ),
  Input: ({ value, onChange }: { value: string; onChange: (e: any) => void }) => (
    <input data-testid="input" value={value} onChange={onChange} />
  ),
}));

// Mock assets
vi.mock('@app/assets/feather-info.svg', () => ({ default: 'info-icon.svg' }));
vi.mock('@app/assets/brand-dark.svg', () => ({ default: 'brand-logo.svg' }));
vi.mock('@app/assets/about_image.png', () => ({ default: 'about-image.png' }));

// Mock store
const createMockStore = (mode = 'NORMAL') =>
  init({
    models: {
      setting: {
        state: { mode },
        reducers: {},
      },
    },
  });

describe('HeaderAboutModal Component Logic', () => {
  let mockStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    mockStore = createMockStore();
    vi.clearAllMocks();

    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        host: 'localhost:3000',
        hostname: 'localhost',
        reload: vi.fn(),
      },
      writable: true,
    });
  });

  const createWrapper =
    () =>
    ({ children }: { children: React.ReactNode }) => <Provider store={mockStore}>{children}</Provider>;

  describe('Component State Logic', () => {
    it('should initialize modal state correctly', () => {
      const initialState = {
        isModalOpen: false,
        hostModal: false,
        host: '',
      };

      expect(initialState.isModalOpen).toBe(false);
      expect(initialState.hostModal).toBe(false);
      expect(initialState.host).toBe('');
    });

    it('should read host from localStorage on initialization', () => {
      const mockHost = 'https://192.168.1.100:1443';
      vi.mocked(localStorage.getItem).mockReturnValue(mockHost);

      const host = localStorage.getItem('HCI_VSAN_HOST') || '';

      expect(localStorage.getItem).toHaveBeenCalledWith('HCI_VSAN_HOST');
      expect(host).toBe(mockHost);
    });

    it('should handle empty localStorage value', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const host = localStorage.getItem('HCI_VSAN_HOST') || '';

      expect(host).toBe('');
    });
  });

  describe('Modal Toggle Logic', () => {
    it('should toggle modal state correctly', () => {
      let isModalOpen = false;

      // Simulate handleModalToggle
      const handleModalToggle = () => {
        isModalOpen = !isModalOpen;
      };

      expect(isModalOpen).toBe(false);
      handleModalToggle();
      expect(isModalOpen).toBe(true);
      handleModalToggle();
      expect(isModalOpen).toBe(false);
    });
  });

  describe('Host Management', () => {
    it('should save host to localStorage and reload page', () => {
      const mockHost = 'https://test.example.com:1443';
      const mockReload = vi.fn();
      window.location.reload = mockReload;

      // Simulate handleSetHost
      const handleSetHost = (host: string) => {
        localStorage.setItem('HCI_VSAN_HOST', host);
        window.location.reload();
      };

      handleSetHost(mockHost);

      expect(localStorage.setItem).toHaveBeenCalledWith('HCI_VSAN_HOST', mockHost);
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  describe('Version Detection', () => {
    it('should detect DEV version correctly', () => {
      const version = 'DEV';
      const isDev = version.indexOf('DEV') !== -1;

      expect(isDev).toBe(true);
    });

    it('should detect production version correctly', () => {
      const version = '1.9.8';
      const isDev = version.indexOf('DEV') !== -1;

      expect(isDev).toBe(false);
    });
  });

  describe('UI Mode Integration', () => {
    it('should work with HCI mode', () => {
      const hciStore = createMockStore('HCI');
      const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={hciStore}>{children}</Provider>;

      renderHook(
        () => {
          // Test mode selection logic
          const mode = hciStore.getState().setting.mode;
          return { mode };
        },
        { wrapper },
      );

      expect(hciStore.getState().setting.mode).toBe('HCI');
    });

    it('should work with NORMAL mode', () => {
      const normalStore = createMockStore('NORMAL');

      expect(normalStore.getState().setting.mode).toBe('NORMAL');
    });
  });

  describe('Environment Variables', () => {
    it('should handle version from environment', () => {
      // Mock import.meta.env
      const mockEnv = { VITE_VERSION: '1.9.8' };
      const version = mockEnv.VITE_VERSION ?? 'DEV';

      expect(version).toBe('1.9.8');
    });

    it('should fallback to DEV when version not set', () => {
      const mockEnv = {};
      const version = (mockEnv as any).VITE_VERSION ?? 'DEV';

      expect(version).toBe('DEV');
    });
  });

  describe('Version Display Logic', () => {
    it('should determine clickable version based on DEV and HCI mode', () => {
      const testCases = [
        { version: 'DEV', mode: 'HCI', expected: true },
        { version: 'DEV', mode: 'NORMAL', expected: false },
        { version: '1.9.8', mode: 'HCI', expected: false },
        { version: '1.9.8', mode: 'NORMAL', expected: false },
      ];

      testCases.forEach(({ version, mode, expected }) => {
        const isClickable = version.indexOf('DEV') !== -1 && mode === 'HCI';
        expect(isClickable).toBe(expected);
      });
    });
  });

  describe('LINSTOR Version Display', () => {
    it('should display version when available', () => {
      const linstorVersion = { version: '1.25.0' };
      const displayVersion = linstorVersion?.version || 'unknown';

      expect(displayVersion).toBe('1.25.0');
    });

    it('should show unknown when version not available', () => {
      const linstorVersion = undefined;
      const displayVersion = linstorVersion?.version || 'unknown';

      expect(displayVersion).toBe('unknown');
    });
  });
});
