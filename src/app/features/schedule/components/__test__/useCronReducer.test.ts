// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useCronReducer } from '../useCronReducer';

// The input value is what the user is typing; the cron value is the last
// expression that passed validation. They must be movable independently.

describe('useCronReducer', () => {
  it('starts both values from the default', () => {
    const { result } = renderHook(() => useCronReducer('0 0 * * *'));
    expect(result.current[0]).toEqual({ inputValue: '0 0 * * *', cronValue: '0 0 * * *' });
  });

  it('set_input_value changes only what is typed', () => {
    const { result } = renderHook(() => useCronReducer('0 0 * * *'));
    act(() => result.current[1]({ type: 'set_input_value', value: '0 0 * *' }));
    expect(result.current[0]).toEqual({ inputValue: '0 0 * *', cronValue: '0 0 * * *' });
  });

  it('set_cron_value commits without touching the input', () => {
    const { result } = renderHook(() => useCronReducer('0 0 * * *'));
    act(() => result.current[1]({ type: 'set_input_value', value: '5 4 * * *' }));
    act(() => result.current[1]({ type: 'set_cron_value', value: '5 4 * * *' }));
    expect(result.current[0]).toEqual({ inputValue: '5 4 * * *', cronValue: '5 4 * * *' });
  });

  it('set_values replaces both at once', () => {
    const { result } = renderHook(() => useCronReducer('0 0 * * *'));
    act(() => result.current[1]({ type: 'set_input_value', value: 'garbage' }));
    act(() => result.current[1]({ type: 'set_values', value: '*/15 * * * *' }));
    expect(result.current[0]).toEqual({ inputValue: '*/15 * * * *', cronValue: '*/15 * * * *' });
  });
});
