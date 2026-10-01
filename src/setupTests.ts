import './setupNoMotion';
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach } from 'vitest';
import { act, cleanup, configure } from '@testing-library/react';
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

// act() warnings about a component inside antd / rc-* (toast holders, form
// fields, animations) updating on its own timer after an interaction are not
// something a test can wrap; they were ~1,500 of the log's warnings and hid
// the rest. An act() warning whose updating component is our code, i.e. whose
// first stack frame is not under node_modules, still gets through.
// rc-util's isEqual (used by rc-field-form to compare a field's meta) takes
// any object it meets twice for a cycle. While a field re-validates, both its
// errors and warnings are the same empty-array constant, so it reports "There
// may be circular references" for data that has none. Only that exact message
// is dropped.
const RC_UTIL_FALSE_CYCLE = 'Warning: Warning: There may be circular references';

const unexpectedLogs: ['error' | 'warn', unknown[]][] = [];
const reportError = console.error;
console.error = (...args: unknown[]) => {
  const [format, , stack] = args;
  if (format === RC_UTIL_FALSE_CYCLE) {
    return;
  }
  const [, component] = args;
  if (typeof format === 'string' && format.includes('not wrapped in act(')) {
    // React 18 passed the component stack as an argument; React 19 does not,
    // so the call stack of the warning itself tells who updated the state:
    // its first frame outside React.
    const firstFrame =
      typeof stack === 'string'
        ? (stack.trimStart().split('\n')[0] ?? '')
        : ((new Error().stack ?? '')
            .split('\n')
            .slice(1)
            .find((frame) => !/setupTests|node_modules\/(react|react-dom|scheduler)\//.test(frame)) ?? '');
    // antd's static message API renders into a React root of its own: no
    // frames at all, the component is called "Root".
    const antdMessageRoot = component === 'Root' && !firstFrame.includes('src/');
    if (antdMessageRoot || /^\s*at [^\n]*node_modules\//.test(firstFrame)) {
      return;
    }
  }
  unexpectedLogs.push(['error', args]);
  reportError(...args);
};

const reportWarning = console.warn;
console.warn = (...args: unknown[]) => {
  unexpectedLogs.push(['warn', args]);
  reportWarning(...args);
};

// Whatever reaches the two above was not expected: a test that makes the GUI
// log an error on purpose captures it (captureConsoleError in @app/testing/console) and
// asserts on it. Anything else fails the test that logged it, so the run's
// output stays empty and a real error does not hide among expected ones.
afterEach(() => {
  const logged = unexpectedLogs.splice(0);
  if (logged.length) {
    // Unmount first: a failing hook skips the rest, and the next test would
    // meet this one's DOM.
    cleanup();
    const summary = logged.map(([level, args]) => `console.${level}: ${args.map(String).join(' ')}`).join('\n');
    throw new Error(`Unexpected console output:\n${summary}`);
  }
});

// Set timezone to UTC for consistent test results across different machines
// This ensures that time-related tests produce the same results regardless of
// the local timezone of the machine running the tests
process.env.TZ = 'UTC';

// jsdom's getComputedStyle cascades every injected antd style on each call,
// which made the suite several times slower; a stub is enough for the tests.
// Lengths read as 0px rather than '', which parseFloat turns into NaN (TextArea
// autoSize then set `height: NaN`).
const LENGTH_PROPERTY = /^(width|height|(padding|margin|border)-.*|line-height|font-size)$/;
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (property: string) => (LENGTH_PROPERTY.test(property) ? '0px' : ''),
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

// jsdom has no canvas; getContext returns nothing either way, it only prints
// "Not implemented" first (antd's Upload draws its thumbnails on one). null is
// what a browser answers for a context it cannot provide.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

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
