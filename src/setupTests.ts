import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from './translations';

// Initialise i18n once for the entire test suite so components using
// useTranslation() render with real translated strings.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: translations,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

// findBy*/waitFor give up after 1 s by default. The shared CI runner is about
// ten times slower than a laptop (see testTimeout in vite.config.ts): antd's
// async form validation or a list refetch there regularly outlasts 1 s, which
// failed assertions that pass locally. Like testTimeout, this is a hang guard,
// not a performance target.
configure({ asyncUtilTimeout: 5000 });

// Set timezone to UTC for consistent test results across different machines
// This ensures that time-related tests produce the same results regardless of
// the local timezone of the machine running the tests
process.env.TZ = 'UTC';

// Mock getComputedStyle for jsdom compatibility
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
    display: '',
    position: '',
    width: '',
    height: '',
    margin: '',
    padding: '',
    border: '',
    fontSize: '',
    fontFamily: '',
    color: '',
    backgroundColor: '',
  }),
});

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia for Ant Design components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
