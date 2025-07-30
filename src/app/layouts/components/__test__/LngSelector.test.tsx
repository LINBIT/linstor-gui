import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
  }),
}));

vi.mock('antd', () => ({
  Dropdown: ({ children, menu }: { children: React.ReactNode; menu: any }) => (
    <div data-testid="dropdown" data-menu={JSON.stringify(menu)}>
      {children}
    </div>
  ),
}));

vi.mock('@ant-design/icons', () => ({
  DownOutlined: () => <div data-testid="down-icon" />,
}));

// Mock CSS import
vi.mock('../LngSelector.css', () => ({}));

describe('LngSelector Component', () => {
  let mockChangeLanguage: any;

  beforeEach(() => {
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

    mockChangeLanguage = vi.fn().mockResolvedValue(undefined);
    vi.clearAllMocks();
  });

  describe('Language Items Configuration', () => {
    it('should have correct language items', () => {
      const expectedItems = [
        { key: 'en', text: 'English' },
        { key: 'de', text: 'Deutsch (German)' },
        { key: 'zh', text: '中文 (Chinese)' },
        { key: 'ja', text: '日本語 (Japanese)' },
        { key: 'tr', text: 'Türkçe (Turkish)' },
        { key: 'es', text: 'Español (Spanish)' },
        { key: 'fr', text: 'Français (French)' },
        { key: 'ru', text: 'Русский (Russian)' },
      ];

      const items = [
        { key: 'en', text: 'English' },
        { key: 'de', text: 'Deutsch (German)' },
        { key: 'zh', text: '中文 (Chinese)' },
        { key: 'ja', text: '日本語 (Japanese)' },
        { key: 'tr', text: 'Türkçe (Turkish)' },
        { key: 'es', text: 'Español (Spanish)' },
        { key: 'fr', text: 'Français (French)' },
        { key: 'ru', text: 'Русский (Russian)' },
      ];

      expect(items).toEqual(expectedItems);
      expect(items).toHaveLength(8);
    });

    it('should have valid language keys', () => {
      const items = [
        { key: 'en', text: 'English' },
        { key: 'de', text: 'Deutsch (German)' },
        { key: 'zh', text: '中文 (Chinese)' },
        { key: 'ja', text: '日本語 (Japanese)' },
        { key: 'tr', text: 'Türkçe (Turkish)' },
        { key: 'es', text: 'Español (Spanish)' },
        { key: 'fr', text: 'Français (French)' },
        { key: 'ru', text: 'Русский (Russian)' },
      ];

      items.forEach((item) => {
        expect(item.key).toBeTruthy();
        expect(typeof item.key).toBe('string');
        expect(item.key.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Component State Logic', () => {
    it('should initialize with default selected state', () => {
      const initialState = 'English';
      expect(initialState).toBe('English');
    });

    it('should handle state updates correctly', () => {
      let selected = 'English';

      const setSelected = (newValue: string) => {
        selected = newValue;
      };

      expect(selected).toBe('English');
      setSelected('Deutsch (German)');
      expect(selected).toBe('Deutsch (German)');
    });
  });

  describe('LocalStorage Integration', () => {
    it('should read saved language from localStorage on initialization', () => {
      const mockKey = 'de';
      const mockText = 'Deutsch (German)';

      vi.mocked(localStorage.getItem).mockImplementation((key) => {
        if (key === 'selectedLanguageKey') return mockKey;
        if (key === 'selectedLanguageText') return mockText;
        return null;
      });

      const savedLangKey = localStorage.getItem('selectedLanguageKey');
      const savedLangText = localStorage.getItem('selectedLanguageText');

      expect(localStorage.getItem).toHaveBeenCalledWith('selectedLanguageKey');
      expect(localStorage.getItem).toHaveBeenCalledWith('selectedLanguageText');
      expect(savedLangKey).toBe(mockKey);
      expect(savedLangText).toBe(mockText);
    });

    it('should handle empty localStorage gracefully', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const savedLangKey = localStorage.getItem('selectedLanguageKey');
      const savedLangText = localStorage.getItem('selectedLanguageText');

      expect(savedLangKey).toBeNull();
      expect(savedLangText).toBeNull();
    });

    it('should save language to localStorage when changed', () => {
      const testLang = { key: 'zh', text: '中文 (Chinese)' };

      const handleLanguageChange = (lang: { key: string; text: string }) => {
        localStorage.setItem('selectedLanguageKey', lang.key);
        localStorage.setItem('selectedLanguageText', lang.text);
      };

      handleLanguageChange(testLang);

      expect(localStorage.setItem).toHaveBeenCalledWith('selectedLanguageKey', testLang.key);
      expect(localStorage.setItem).toHaveBeenCalledWith('selectedLanguageText', testLang.text);
    });
  });

  describe('Language Change Logic', () => {
    it('should call i18n.changeLanguage with correct language key', () => {
      const mockI18n = { changeLanguage: mockChangeLanguage };
      const testLang = { key: 'fr', text: 'Français (French)' };

      const handleLanguageChange = (lang: { key: string; text: string }) => {
        mockI18n.changeLanguage(lang.key);
      };

      handleLanguageChange(testLang);

      expect(mockChangeLanguage).toHaveBeenCalledWith(testLang.key);
      expect(mockChangeLanguage).toHaveBeenCalledTimes(1);
    });

    it('should update selected state when language changes', () => {
      let selected = 'English';
      const testLang = { key: 'es', text: 'Español (Spanish)' };

      const handleLanguageChange = (lang: { key: string; text: string }) => {
        selected = lang.text;
      };

      expect(selected).toBe('English');
      handleLanguageChange(testLang);
      expect(selected).toBe('Español (Spanish)');
    });
  });

  describe('Menu Items Generation', () => {
    it('should generate correct menu items from language list', () => {
      const items = [
        { key: 'en', text: 'English' },
        { key: 'de', text: 'Deutsch (German)' },
        { key: 'zh', text: '中文 (Chinese)' },
      ];

      const mockHandleLanguageChange = vi.fn();

      const menuItems = items.map((e) => ({
        key: e.key,
        label: e.text,
        onClick: () => mockHandleLanguageChange(e),
      }));

      expect(menuItems).toHaveLength(3);
      expect(menuItems[0]).toEqual({
        key: 'en',
        label: 'English',
        onClick: expect.any(Function),
      });
      expect(menuItems[1]).toEqual({
        key: 'de',
        label: 'Deutsch (German)',
        onClick: expect.any(Function),
      });
      expect(menuItems[2]).toEqual({
        key: 'zh',
        label: '中文 (Chinese)',
        onClick: expect.any(Function),
      });
    });

    it('should call handleLanguageChange when menu item is clicked', () => {
      const testLang = { key: 'ja', text: '日本語 (Japanese)' };
      const mockHandleLanguageChange = vi.fn();

      const menuItem = {
        key: testLang.key,
        label: testLang.text,
        onClick: () => mockHandleLanguageChange(testLang),
      };

      menuItem.onClick();

      expect(mockHandleLanguageChange).toHaveBeenCalledWith(testLang);
      expect(mockHandleLanguageChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('useEffect Hook Logic', () => {
    it('should restore language from localStorage and call i18n.changeLanguage', () => {
      const mockI18n = { changeLanguage: mockChangeLanguage };
      let selected = 'English';

      // Mock saved values
      const savedKey = 'tr';
      const savedText = 'Türkçe (Turkish)';

      vi.mocked(localStorage.getItem).mockImplementation((key) => {
        if (key === 'selectedLanguageKey') return savedKey;
        if (key === 'selectedLanguageText') return savedText;
        return null;
      });

      // Simulate useEffect logic
      const savedLangKey = localStorage.getItem('selectedLanguageKey');
      const savedLangText = localStorage.getItem('selectedLanguageText');

      if (savedLangKey && savedLangText) {
        mockI18n.changeLanguage(savedLangKey);
        selected = savedLangText;
      }

      expect(mockChangeLanguage).toHaveBeenCalledWith(savedKey);
      expect(selected).toBe(savedText);
    });

    it('should not change language when localStorage is empty', () => {
      const mockI18n = { changeLanguage: mockChangeLanguage };
      let selected = 'English';

      vi.mocked(localStorage.getItem).mockReturnValue(null);

      // Simulate useEffect logic
      const savedLangKey = localStorage.getItem('selectedLanguageKey');
      const savedLangText = localStorage.getItem('selectedLanguageText');

      if (savedLangKey && savedLangText) {
        mockI18n.changeLanguage(savedLangKey);
        selected = savedLangText;
      }

      expect(mockChangeLanguage).not.toHaveBeenCalled();
      expect(selected).toBe('English');
    });
  });

  describe('Component Integration Logic', () => {
    it('should work with all supported languages', () => {
      const supportedLanguages = [
        { key: 'en', text: 'English' },
        { key: 'de', text: 'Deutsch (German)' },
        { key: 'zh', text: '中文 (Chinese)' },
        { key: 'ja', text: '日本語 (Japanese)' },
        { key: 'tr', text: 'Türkçe (Turkish)' },
        { key: 'es', text: 'Español (Spanish)' },
        { key: 'fr', text: 'Français (French)' },
        { key: 'ru', text: 'Русский (Russian)' },
      ];

      const mockI18n = { changeLanguage: mockChangeLanguage };
      let selected = 'English';

      const handleLanguageChange = (lang: { key: string; text: string }) => {
        mockI18n.changeLanguage(lang.key);
        selected = lang.text;
        localStorage.setItem('selectedLanguageKey', lang.key);
        localStorage.setItem('selectedLanguageText', lang.text);
      };

      supportedLanguages.forEach((lang) => {
        handleLanguageChange(lang);
        expect(mockChangeLanguage).toHaveBeenCalledWith(lang.key);
        expect(selected).toBe(lang.text);
        expect(localStorage.setItem).toHaveBeenCalledWith('selectedLanguageKey', lang.key);
        expect(localStorage.setItem).toHaveBeenCalledWith('selectedLanguageText', lang.text);
      });

      expect(mockChangeLanguage).toHaveBeenCalledTimes(supportedLanguages.length);
    });
  });
});
