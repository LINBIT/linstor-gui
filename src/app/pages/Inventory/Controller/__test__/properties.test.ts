// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';

import { editorFor, groupOf, isDefault, isEditable, isSecret, matches } from '../properties';

describe('controller properties', () => {
  it('groups by namespace', () => {
    expect(groupOf('DrbdOptions/Resource/on-no-quorum')).toBe('drbd');
    expect(groupOf('Auth/TokenAuthenticationEnabled')).toBe('security');
    expect(groupOf('REST/AutoHTTPS')).toBe('security');
    expect(groupOf('encrypted/masterkey')).toBe('security');
    expect(groupOf('AutoDbExport/Cron')).toBe('db_export');
    expect(groupOf('Aux/owner')).toBe('aux');
    expect(groupOf('NetCom/SslConnector/Port')).toBe('connections');
    expect(groupOf('defaultPlainConSvc')).toBe('connections');
    expect(groupOf('defaultDebugSslConnector')).toBe('connections');
    expect(groupOf('Cluster/LocalID')).toBe('other');
  });

  it('treats passwords and the encryption keys as secrets', () => {
    expect(isSecret('NetCom/SslConnector/KeyPasswd')).toBe(true);
    expect(isSecret('NetCom/SslConnector/TrustStorePasswd')).toBe(true);
    expect(isSecret('encrypted/masterhash')).toBe(true);
    expect(isSecret('NetCom/SslConnector/KeyStore')).toBe(false);
    expect(isSecret('Aux/password-hint')).toBe(false);
  });

  it('edits each property type with a matching input', () => {
    expect(editorFor({ prop_type: 'boolean_true_false', value: '(?i)(?:true|false|yes|no)' })).toEqual({
      kind: 'switch',
    });
    expect(editorFor({ prop_type: 'boolean', value: '(?i)(?:yes|no)' })).toEqual({
      kind: 'select',
      options: ['yes', 'no'],
    });
    expect(editorFor({ prop_type: 'regex', value: '(?:io-error|suspend-io)' })).toEqual({
      kind: 'select',
      options: ['io-error', 'suspend-io'],
    });
    expect(editorFor({ prop_type: 'regex', value: '[a-z]+[0-9]*' })).toEqual({ kind: 'text', hint: '[a-z]+[0-9]*' });
    expect(editorFor({ prop_type: 'range', value: '(1 - 600)' })).toEqual({ kind: 'number', min: 1, max: 600 });
    expect(editorFor({ prop_type: 'range_float', value: '(0 - 1.5)' })).toEqual({
      kind: 'number',
      min: 0,
      max: 1.5,
      float: true,
    });
    expect(editorFor({ prop_type: 'long' })).toEqual({ kind: 'number' });
    expect(editorFor({ prop_type: 'numeric_or_symbol', value: '(1 - 32) or (?:all|majority|off)' })).toEqual({
      kind: 'text',
      hint: '(1 - 32) or (?:all|majority|off)',
    });
    expect(editorFor({ prop_type: 'string' })).toEqual({ kind: 'text' });
    expect(editorFor(undefined)).toEqual({ kind: 'text' });
  });

  it('compares with the documented default, booleans in any case', () => {
    expect(isDefault('true', { dflt: 'True' })).toBe(true);
    expect(isDefault('7', { dflt: '7' })).toBe(true);
    expect(isDefault('3', { dflt: '7' })).toBe(false);
    expect(isDefault('true', {})).toBe(false);
    expect(isDefault(undefined, { dflt: '7' })).toBe(false);
  });

  it('offers editing only for documented and Aux properties', () => {
    expect(isEditable('Aux/owner')).toBe(true);
    expect(isEditable('DrbdOptions/AutoEvictAllowEviction', { prop_type: 'boolean_true_false' })).toBe(true);
    expect(isEditable('encrypted/masterkey')).toBe(false);
    expect(isEditable('NetCom/PlainConnector/Port')).toBe(false);
  });

  it('searches names and descriptions, ignoring case', () => {
    const info = { info: 'Enables or disables the token authentication.' };
    expect(matches('', 'Auth/TokenAuthenticationEnabled', info)).toBe(true);
    expect(matches('TOKEN', 'Auth/TokenAuthenticationEnabled', info)).toBe(true);
    expect(matches('disables the', 'Auth/X', info)).toBe(true);
    expect(matches('quorum', 'Auth/X', info)).toBe(false);
  });
});
