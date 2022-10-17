import { capitalize } from '../stringUtils';

test('capitalize', () => {
  expect(capitalize('hello')).toBe('Hello');
  expect(capitalize('')).toBe('');
  expect(capitalize('1')).toBe('1');
  expect(capitalize('hello world')).toBe('Hello world');
});
