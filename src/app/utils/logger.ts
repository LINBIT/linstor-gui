// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/**
 * Lightweight logger wrapper.
 *
 * `debug`/`info` are emitted only in development so verbose diagnostics never
 * reach an end user's console in a production build. `warn`/`error` are always
 * emitted because they are useful for diagnosing real issues in the field.
 *
 * Never log secrets (passphrases, tokens, passwords) at any level.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = import.meta.env.MODE === 'development';

const enabled: Record<LogLevel, boolean> = {
  debug: isDev,
  info: isDev,
  warn: true,
  error: true,
};

const sink: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: (...args) => console.debug(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

const emit = (level: LogLevel, args: unknown[]): void => {
  if (enabled[level]) {
    sink[level](...args);
  }
};

export const logger = {
  /** Verbose, development-only. Use for the old `console.log` debugging output. */
  debug: (...args: unknown[]): void => emit('debug', args),
  /** Informational, development-only. */
  info: (...args: unknown[]): void => emit('info', args),
  /** Warnings, always emitted. */
  warn: (...args: unknown[]): void => emit('warn', args),
  /** Errors, always emitted. */
  error: (...args: unknown[]): void => emit('error', args),
};

export default logger;
