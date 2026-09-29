import '@testing-library/jest-dom';
import { afterAll, afterEach } from 'vitest';
import { act, configure } from '@testing-library/react';
import { message, notification } from 'antd';
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

// antd toasts close themselves on a timer. One still pending when a test file
// ends fires after jsdom is torn down and fails the whole run with
// "ReferenceError: window is not defined", although every test passed. Close
// them after each test. (A test file that mocks antd gets its mock; this is the
// real instance, which then simply has nothing to close.)
afterEach(() => {
  act(() => {
    message.destroy();
    notification.destroy();
  });
});

// Any other timer a test file leaves behind (a reload scheduled a second
// later, a retry, a debounce) has the same problem: it fires after jsdom is gone
// and fails the run with an error that points at no test. Track the real
// timers and clear what is still pending once the file is done. Fake timers
// (vi.useFakeTimers) replace these globals while active, so they are unaffected.
const pendingTimers = new Set<ReturnType<typeof setTimeout>>();
const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;
const realSetInterval = globalThis.setInterval;
const realClearInterval = globalThis.clearInterval;

globalThis.setTimeout = Object.assign((callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) => {
  const id = realSetTimeout(
    (...callbackArgs: unknown[]) => {
      pendingTimers.delete(id);
      callback(...callbackArgs);
    },
    delay,
    ...args,
  );
  pendingTimers.add(id);
  return id;
}, realSetTimeout) as typeof setTimeout;
globalThis.clearTimeout = ((id?: ReturnType<typeof setTimeout>) => {
  if (id !== undefined) pendingTimers.delete(id);
  realClearTimeout(id);
}) as typeof clearTimeout;
globalThis.setInterval = Object.assign((callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) => {
  const id = realSetInterval(callback, delay, ...args);
  pendingTimers.add(id);
  return id;
}, realSetInterval) as typeof setInterval;
globalThis.clearInterval = ((id?: ReturnType<typeof setInterval>) => {
  if (id !== undefined) pendingTimers.delete(id);
  realClearInterval(id);
}) as typeof clearInterval;

afterAll(() => {
  pendingTimers.forEach((id) => {
    realClearTimeout(id);
    realClearInterval(id);
  });
  pendingTimers.clear();
});

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
