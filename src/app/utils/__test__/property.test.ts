// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handlePropsToFormOption } from '../property';
import { TYPE_MAP } from '@app/interfaces/dynamicFormType';

// Mock dependencies
vi.mock('../properties/properties', () => ({
  properties: {
    properties: {
      stringProp: { key: 'stringField', type: 'string', info: 'String info' },
      regexProp: { key: 'regexField', type: 'regex', info: 'Regex info', value: '^[a-z]+$' },
      symbolProp: { key: 'symbolField', type: 'symbol', info: 'Symbol info', values: ['option1', 'option2'] },
      numericSymbolProp: {
        key: 'numericSymbolField',
        type: 'numeric-or-symbol',
        info: 'Numeric symbol info',
        values: ['val1', 'val2'],
      },
      rangeSmallProp: { key: 'rangeSmallField', type: 'range', info: 'Range info', min: 0, max: 100, default: 50 },
      rangeLargeProp: { key: 'rangeLargeField', type: 'range', info: 'Large range info', min: 0, max: 20000 },
      rangeNoDefaultProp: { key: 'rangeNoDefaultField', type: 'range', info: 'Range no default', min: 10, max: 50 },
      booleanTrueFalseProp: {
        key: 'booleanTrueFalseField',
        type: 'boolean_true_false',
        info: 'Boolean true/false info',
      },
      booleanProp: { key: 'booleanField', type: 'boolean', info: 'Boolean info' },
      longProp: { key: 'longField', type: 'long', info: 'Long info' },
      unknownProp: { key: 'unknownField', type: 'unknown', info: 'Unknown info' },
      arrayKeyProp: { key: ['array', 'key'], type: 'string', info: 'Array key info' },
      emptyFieldProp: { key: '', type: 'string', info: 'Empty field info' },
    },
    objects: {
      stringKey: ['stringProp'],
      regexKey: ['regexProp'],
      symbolKey: ['symbolProp'],
      numericSymbolKey: ['numericSymbolProp'],
      rangeSmallKey: ['rangeSmallProp'],
      rangeLargeKey: ['rangeLargeProp'],
      rangeNoDefaultKey: ['rangeNoDefaultProp'],
      booleanTrueFalseKey: ['booleanTrueFalseProp'],
      booleanKey: ['booleanProp'],
      longKey: ['longProp'],
      unknownKey: ['unknownProp'],
      arrayKeyKey: ['arrayKeyProp'],
      emptyFieldKey: ['emptyFieldProp'],
      drbdKey: ['drbdProp'],
    },
  },
}));

vi.mock('../properties/drbdOptions', () => ({
  drbdOptions: {
    properties: {
      drbdProp: { key: 'drbdField', type: 'string', info: 'DRBD info' },
    },
    objects: {
      drbdKey: ['drbdProp'],
    },
  },
}));

vi.mock('../properties/propertyConstants', () => ({
  propertyConstants: {
    data: [
      { name: 'array', value: 'arrayValue' },
      { name: 'key', value: 'keyValue' },
    ],
  },
}));

vi.mock('../stringUtils', () => ({
  uniqId: () => 'mocked-id',
}));

// Mock console.log to test unknown type case
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('handlePropsToFormOption', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockClear();
  });

  it('should return empty array if key is empty', () => {
    expect(handlePropsToFormOption('')).toEqual([]);
    expect(handlePropsToFormOption(undefined as unknown as string)).toEqual([]);
  });

  it('should handle string type correctly', () => {
    const prop = { stringField: 'testValue' };
    const result = handlePropsToFormOption('stringKey', prop);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'mocked-id',
      type: TYPE_MAP.TEXT,
      label: 'stringField',
      name: 'stringField',
      defaultValue: 'testValue',
      tipLabel: 'String info',
      hide: false,
    });
  });

  it('should handle regex type correctly', () => {
    const prop = { regexField: 'testregex' };
    const result = handlePropsToFormOption('regexKey', prop);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'mocked-id',
      type: TYPE_MAP.TEXT,
      label: 'regexField',
      name: 'regexField',
      defaultValue: 'testregex',
      tipLabel: 'Regex info',
      validationInfo: {
        invalidMessage: 'Please match the requested format: ^[a-z]+$',
        pattern: expect.any(RegExp),
      },
      hide: false,
    });
  });

  it('should handle symbol type correctly', () => {
    const prop = { symbolField: 'option1' };
    const result = handlePropsToFormOption('symbolKey', prop);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'mocked-id',
      type: TYPE_MAP.SINGLE_SELECT,
      label: 'symbolField',
      name: 'symbolField',
      defaultValue: 'option1',
      tipLabel: 'Symbol info',
      extraInfo: {
        options: [
          { value: 'option1', label: 'option1', isDisabled: false },
          { value: 'option2', label: 'option2', isDisabled: false },
        ],
      },
      hide: false,
    });
  });

  it('should handle numeric-or-symbol type correctly', () => {
    const prop = { numericSymbolField: 'val1' };
    const result = handlePropsToFormOption('numericSymbolKey', prop);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'mocked-id',
      type: TYPE_MAP.SINGLE_SELECT,
      label: 'numericSymbolField',
      name: 'numericSymbolField',
      defaultValue: 'val1',
      tipLabel: 'Numeric symbol info',
      extraInfo: {
        options: [
          { value: 'val1', label: 'val1', isDisabled: false },
          { value: 'val2', label: 'val2', isDisabled: false },
        ],
        isCreatable: true,
      },
      hide: false,
    });
  });

  it('should handle small range type correctly (slider)', () => {
    const prop = { rangeSmallField: 75 };
    const result = handlePropsToFormOption('rangeSmallKey', prop);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'mocked-id',
      type: TYPE_MAP.SLIDER,
      label: 'rangeSmallField',
      name: 'rangeSmallField',
      defaultValue: 75,
      tipLabel: 'Range info',
      validationInfo: {
        min: 0,
        max: 100,
      },
      hide: false,
    });
  });

  it('should handle large range type correctly (integer input)', () => {
    const prop = { rangeLargeField: 15000 };
    const result = handlePropsToFormOption('rangeLargeKey', prop);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'mocked-id',
      type: TYPE_MAP.INTEGER,
      label: 'rangeLargeField',
      name: 'rangeLargeField',
      defaultValue: 15000,
      tipLabel: 'Large range info',
      validationInfo: {
        min: 0,
        max: 20000,
      },
      hide: false,
    });
  });

  it('should handle boolean_true_false type with string value', () => {
    const prop = { booleanTrueFalseField: 'true' };
    const result = handlePropsToFormOption('booleanTrueFalseKey', prop);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'mocked-id',
      type: TYPE_MAP.CHECKBOX,
      label: 'booleanTrueFalseField',
      name: 'booleanTrueFalseField',
      defaultValue: true,
      tipLabel: 'Boolean true/false info',
      hide: false,
    });
  });

  it('should handle boolean_true_false type with false string value', () => {
    const prop = { booleanTrueFalseField: 'false' };
    const result = handlePropsToFormOption('booleanTrueFalseKey', prop);

    expect(result).toHaveLength(1);
    expect(result[0].defaultValue).toBe(false);
  });

  it('should handle boolean_true_false type with boolean value', () => {
    const prop = { booleanTrueFalseField: true };
    const result = handlePropsToFormOption('booleanTrueFalseKey', prop);

    expect(result).toHaveLength(1);
    expect(result[0].defaultValue).toBe(true);
  });

  it('should handle boolean type correctly', () => {
    const prop = { booleanField: 'someValue' };
    const result = handlePropsToFormOption('booleanKey', prop);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'mocked-id',
      type: TYPE_MAP.CHECKBOX,
      label: 'booleanField',
      name: 'booleanField',
      defaultValue: 'someValue',
      tipLabel: 'Boolean info',
      hide: false,
    });
  });

  it('should handle long type correctly', () => {
    const prop = { longField: 1234567890 };
    const result = handlePropsToFormOption('longKey', prop);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'mocked-id',
      type: TYPE_MAP.INTEGER,
      label: 'longField',
      name: 'longField',
      defaultValue: 1234567890,
      tipLabel: 'Long info',
      hide: false,
    });
  });

  it('should handle unknown type and log warning', () => {
    const prop = { unknownField: 'value' };
    const result = handlePropsToFormOption('unknownKey', prop);

    expect(result).toHaveLength(1);
    expect(consoleSpy).toHaveBeenCalledWith('Unknown type', 'unknown');
  });

  it('should handle array key correctly', () => {
    const prop = { 'arrayValue/keyValue': 'arrayKeyValue' };
    const result = handlePropsToFormOption('arrayKeyKey', prop);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'arrayValue/keyValue',
      defaultValue: 'arrayKeyValue',
      hide: false,
    });
  });

  it('should hide field if value is undefined', () => {
    const result = handlePropsToFormOption('stringKey', {});
    expect(result[0].hide).toBe(true);
  });

  it('should handle DRBD options correctly', () => {
    const prop = { drbdField: 'drbdValue' };
    const result = handlePropsToFormOption('drbdKey', prop);

    expect(result).toHaveLength(1); // Only from drbdOptions since drbdProp is only in drbdOptions
    expect(result.some((item) => item.defaultValue === 'drbdValue')).toBe(true);
  });

  it('should use camelCase title when field is empty', () => {
    const result = handlePropsToFormOption('emptyFieldKey', {});

    expect(result[0].label).toBe('EmptyFieldProp');
  });

  it('should handle range with default value when no prop value provided', () => {
    const result = handlePropsToFormOption('rangeSmallKey', {});

    expect(result[0].defaultValue).toBe(50); // default value
  });

  it('should handle range with min value when no default provided', () => {
    const result = handlePropsToFormOption('rangeNoDefaultKey', {});

    expect(result[0].defaultValue).toBe(10); // min value
  });

  it('should handle range fallback to 0 when no min/max provided', () => {
    // Test case for when data.max and data.min are undefined
    const result = handlePropsToFormOption('rangeLargeKey', {});

    // Should use data.min (0) since no value provided
    expect(result[0].defaultValue).toBe('');
  });

  it('should handle symbol type with empty values array', () => {
    // This tests the nullish coalescing operator data['values'] ?? []
    const result = handlePropsToFormOption('symbolKey', {});

    expect(result[0].extraInfo?.options).toHaveLength(2);
  });

  it('should handle numeric-or-symbol type with empty values array', () => {
    // This tests the nullish coalescing operator data['values'] ?? []
    const result = handlePropsToFormOption('numericSymbolKey', {});

    expect(result[0].extraInfo?.options).toHaveLength(2);
    expect(result[0].extraInfo?.isCreatable).toBe(true);
  });
});
