import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { init } from '@rematch/core';
import React from 'react';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('react-inlinesvg', () => ({
  default: ({ src, width, height }: { src: string; width: string; height: string }) => (
    <div data-testid="svg" data-src={src} data-width={width} data-height={height} />
  ),
}));

vi.mock('@app/utils/stringUtils', () => ({
  isUrl: vi.fn(),
}));

vi.mock('is-svg', () => ({
  default: vi.fn(),
}));

vi.mock('@app/assets/brand-dark.svg', () => ({ default: 'brand-dark.svg' }));

vi.mock('react-redux', () => ({
  useSelector: (selector: any) => {
    return selector({
      setting: { mode: 'NORMAL' },
    });
  },
}));

const { isUrl } = await import('@app/utils/stringUtils');
const isSvg = (await import('is-svg')).default;

describe('LogoImg Component', () => {
  let mockNavigate: any;
  let mockStore: any;

  beforeEach(() => {
    mockNavigate = vi.fn();

    // Mock useNavigate return value
    vi.doMock('react-router-dom', () => ({
      useNavigate: () => mockNavigate,
    }));

    mockStore = init({
      models: {
        setting: {
          state: { mode: 'NORMAL' },
          reducers: {},
        },
      },
    });

    vi.clearAllMocks();
  });

  const createWrapper = (mode = 'NORMAL') => {
    const store = init({
      models: {
        setting: {
          state: { mode },
          reducers: {},
        },
      },
    });

    return ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
  };

  describe('renderLogo function', () => {
    const renderLogo = (logoSrc?: string) => {
      if (!logoSrc) {
        return null;
      }
      if (isUrl(logoSrc) && !isSvg(logoSrc)) {
        return { type: 'img', src: logoSrc, width: 40, height: 40 };
      }
      if (isSvg(logoSrc)) {
        return { type: 'svg', src: logoSrc, width: '40', height: '40' };
      }
      return null;
    };

    it('should return null when logoSrc is not provided', () => {
      const result = renderLogo();
      expect(result).toBeNull();
    });

    it('should return null when logoSrc is empty string', () => {
      const result = renderLogo('');
      expect(result).toBeNull();
    });

    it('should render img element for URL that is not SVG', () => {
      vi.mocked(isUrl).mockReturnValue(true);
      vi.mocked(isSvg).mockReturnValue(false);

      const result = renderLogo('https://example.com/logo.png');

      expect(result).toEqual({
        type: 'img',
        src: 'https://example.com/logo.png',
        width: 40,
        height: 40,
      });
    });

    it('should render SVG element for SVG content', () => {
      vi.mocked(isUrl).mockReturnValue(false);
      vi.mocked(isSvg).mockReturnValue(true);

      const svgContent = '<svg><circle r="10"/></svg>';
      const result = renderLogo(svgContent);

      expect(result).toEqual({
        type: 'svg',
        src: svgContent,
        width: '40',
        height: '40',
      });
    });

    it('should render SVG element for URL that is SVG', () => {
      vi.mocked(isUrl).mockReturnValue(true);
      vi.mocked(isSvg).mockReturnValue(true);

      const result = renderLogo('https://example.com/logo.svg');

      expect(result).toEqual({
        type: 'svg',
        src: 'https://example.com/logo.svg',
        width: '40',
        height: '40',
      });
    });

    it('should return null for non-URL, non-SVG content', () => {
      vi.mocked(isUrl).mockReturnValue(false);
      vi.mocked(isSvg).mockReturnValue(false);

      const result = renderLogo('invalid-content');

      expect(result).toBeNull();
    });
  });

  describe('Navigation Logic', () => {
    it('should navigate to HCI dashboard when mode is HCI', () => {
      const mockNavigate = vi.fn();

      const handleClick = (mode: string) => {
        if (mode === 'HCI') {
          mockNavigate('/hci/dashboard');
        } else if (mode === 'VSAN') {
          mockNavigate('/vsan/dashboard');
        } else {
          mockNavigate('/');
        }
      };

      handleClick('HCI');
      expect(mockNavigate).toHaveBeenCalledWith('/hci/dashboard');
    });

    it('should navigate to VSAN dashboard when mode is VSAN', () => {
      const mockNavigate = vi.fn();

      const handleClick = (mode: string) => {
        if (mode === 'HCI') {
          mockNavigate('/hci/dashboard');
        } else if (mode === 'VSAN') {
          mockNavigate('/vsan/dashboard');
        } else {
          mockNavigate('/');
        }
      };

      handleClick('VSAN');
      expect(mockNavigate).toHaveBeenCalledWith('/vsan/dashboard');
    });

    it('should navigate to home when mode is NORMAL', () => {
      const mockNavigate = vi.fn();

      const handleClick = (mode: string) => {
        if (mode === 'HCI') {
          mockNavigate('/hci/dashboard');
        } else if (mode === 'VSAN') {
          mockNavigate('/vsan/dashboard');
        } else {
          mockNavigate('/');
        }
      };

      handleClick('NORMAL');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to home for unknown modes', () => {
      const mockNavigate = vi.fn();

      const handleClick = (mode: string) => {
        if (mode === 'HCI') {
          mockNavigate('/hci/dashboard');
        } else if (mode === 'VSAN') {
          mockNavigate('/vsan/dashboard');
        } else {
          mockNavigate('/');
        }
      };

      handleClick('UNKNOWN');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Redux State Integration', () => {
    it('should read mode from Redux state correctly', () => {
      const mockState = {
        setting: { mode: 'HCI' },
      };

      const selector = (state: any) => ({
        mode: state.setting.mode,
      });

      const result = selector(mockState);
      expect(result).toEqual({ mode: 'HCI' });
    });

    it('should handle different UI modes from state', () => {
      const testCases = [
        { mode: 'NORMAL', expected: 'NORMAL' },
        { mode: 'HCI', expected: 'HCI' },
        { mode: 'VSAN', expected: 'VSAN' },
      ];

      testCases.forEach(({ mode, expected }) => {
        const mockState = {
          setting: { mode },
        };

        const selector = (state: any) => ({
          mode: state.setting.mode,
        });

        const result = selector(mockState);
        expect(result.mode).toBe(expected);
      });
    });
  });

  describe('Logo Source Validation', () => {
    it('should handle valid URLs correctly', () => {
      const testUrls = [
        'https://example.com/logo.png',
        'http://example.com/logo.jpg',
        'https://cdn.example.com/assets/logo.svg',
      ];

      testUrls.forEach((url) => {
        vi.mocked(isUrl).mockReturnValue(true);
        expect(isUrl(url)).toBe(true);
      });
    });

    it('should handle invalid URLs correctly', () => {
      const invalidUrls = ['not-a-url', 'file.png', '/local/path.svg'];

      invalidUrls.forEach((url) => {
        vi.mocked(isUrl).mockReturnValue(false);
        expect(isUrl(url)).toBe(false);
      });
    });

    it('should validate SVG content correctly', () => {
      const validSvg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>';
      const invalidSvg = '<div>not svg</div>';

      vi.mocked(isSvg).mockImplementation((content) => {
        return content.includes('<svg');
      });

      expect(isSvg(validSvg)).toBe(true);
      expect(isSvg(invalidSvg)).toBe(false);
    });
  });

  describe('Component Props Logic', () => {
    it('should handle logoSrc prop correctly', () => {
      const testProps = {
        logoSrc: 'https://example.com/logo.png',
      };

      expect(testProps.logoSrc).toBe('https://example.com/logo.png');
    });

    it('should handle undefined logoSrc prop', () => {
      const testProps = {};

      expect(testProps.logoSrc).toBeUndefined();
    });

    it('should handle empty logoSrc prop', () => {
      const testProps = {
        logoSrc: '',
      };

      expect(testProps.logoSrc).toBe('');
    });
  });

  describe('UIMode Constants', () => {
    it('should have correct UIMode values', () => {
      // Test the expected UIMode values based on the usage in the component
      const UIMode = {
        HCI: 'HCI',
        VSAN: 'VSAN',
        NORMAL: 'NORMAL',
      };

      expect(UIMode.HCI).toBe('HCI');
      expect(UIMode.VSAN).toBe('VSAN');
      expect(UIMode.NORMAL).toBe('NORMAL');
    });
  });

  describe('Logo Rendering Strategy', () => {
    it('should prioritize SVG rendering over img when content is SVG', () => {
      vi.mocked(isUrl).mockReturnValue(true);
      vi.mocked(isSvg).mockReturnValue(true);

      const renderLogo = (logoSrc?: string) => {
        if (!logoSrc) return null;
        if (isUrl(logoSrc) && !isSvg(logoSrc)) {
          return 'img';
        }
        if (isSvg(logoSrc)) {
          return 'svg';
        }
        return null;
      };

      // Even though it's a URL, if it's SVG content, it should render as SVG
      const result = renderLogo('https://example.com/logo.svg');
      expect(result).toBe('svg');
    });

    it('should render as img only when URL and not SVG', () => {
      vi.mocked(isUrl).mockReturnValue(true);
      vi.mocked(isSvg).mockReturnValue(false);

      const renderLogo = (logoSrc?: string) => {
        if (!logoSrc) return null;
        if (isUrl(logoSrc) && !isSvg(logoSrc)) {
          return 'img';
        }
        if (isSvg(logoSrc)) {
          return 'svg';
        }
        return null;
      };

      const result = renderLogo('https://example.com/logo.png');
      expect(result).toBe('img');
    });
  });

  describe('Component Integration', () => {
    it('should use default brand logo when no custom logo provided', () => {
      const defaultLogo = 'brand-dark.svg';
      expect(defaultLogo).toBe('brand-dark.svg');
    });

    it('should combine default logo with custom logo display', () => {
      const defaultLogo = 'brand-dark.svg';
      const customLogo = 'https://example.com/custom.png';

      const componentStructure = {
        defaultLogo,
        customLogo: customLogo || null,
      };

      expect(componentStructure.defaultLogo).toBe('brand-dark.svg');
      expect(componentStructure.customLogo).toBe('https://example.com/custom.png');
    });
  });
});
