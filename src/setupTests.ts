import '@testing-library/jest-dom';

// Set timezone to UTC for consistent test results across different machines
// This ensures that time-related tests produce the same results regardless of
// the local timezone of the machine running the tests
process.env.TZ = 'UTC';
