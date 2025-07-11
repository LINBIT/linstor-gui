import '@testing-library/jest-dom';

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
