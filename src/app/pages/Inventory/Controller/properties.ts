// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/** What the controller says about a property (/v1/controller/properties/info). */
export interface PropertyInfo {
  info?: string;
  prop_type?: string;
  value?: string;
  dflt?: string;
  unit?: string;
}

export type GroupId = 'drbd' | 'security' | 'db_export' | 'aux' | 'connections' | 'other';

/** The order the groups are shown in; connections and other start collapsed. */
export const GROUPS: GroupId[] = ['drbd', 'security', 'db_export', 'aux', 'connections', 'other'];

export const COLLAPSED_GROUPS: GroupId[] = ['connections', 'other'];

export const groupOf = (key: string): GroupId => {
  if (key.startsWith('DrbdOptions/')) return 'drbd';
  if (key.startsWith('Auth/') || key.startsWith('REST/') || key.startsWith('encrypted/')) return 'security';
  if (key.startsWith('AutoDbExport/')) return 'db_export';
  if (key.startsWith('Aux/')) return 'aux';
  // The connector definitions and the names of the default ones.
  if (key.startsWith('NetCom/') || /^default\w*(Connector|ConSvc)$/.test(key)) return 'connections';
  return 'other';
};

/**
 * Key store and trust store passwords and the controller's encryption keys:
 * shown masked until revealed.
 */
export const isSecret = (key: string): boolean => /passw(or)?d$/i.test(key) || key.startsWith('encrypted/');

/**
 * Settings worth showing although nobody set them: a feature configured only
 * through them, whose defaults are what runs.
 */
export const SHOWN_WHEN_UNSET = [
  'AutoDbExport/Cron',
  'AutoDbExport/Keep',
  'AutoDbExport/Path',
  'AutoDbExport/Compress',
];

export type Editor =
  | { kind: 'switch' }
  | { kind: 'select'; options: string[] }
  | { kind: 'number'; min?: number; max?: number; float?: boolean }
  | { kind: 'text'; hint?: string };

/** `(?:a|b|c)`, optionally case-insensitive: a closed set of words. */
const choices = (pattern?: string): string[] | undefined => {
  const match = pattern?.match(/^(?:\(\?i\))?\(\?:([\w.+-]+(?:\|[\w.+-]+)*)\)$/);
  return match ? match[1].split('|') : undefined;
};

/** `(1 - 600)`: the bounds of a range property. */
const bounds = (pattern?: string): { min?: number; max?: number } => {
  const match = pattern?.match(/^\(\s*(-?[\d.]+)\s*-\s*(-?[\d.]+)\s*\)$/);
  return match ? { min: Number(match[1]), max: Number(match[2]) } : {};
};

/** The input a property is edited with, from the type the controller gives it. */
export const editorFor = (info?: PropertyInfo): Editor => {
  switch (info?.prop_type) {
    case 'boolean_true_false':
      return { kind: 'switch' };
    case 'range':
      return { kind: 'number', ...bounds(info.value) };
    case 'range_float':
      return { kind: 'number', ...bounds(info.value), float: true };
    case 'long':
      return { kind: 'number' };
    case 'boolean':
    case 'regex': {
      const options = choices(info.value);
      return options ? { kind: 'select', options } : { kind: 'text', hint: info.value };
    }
    case 'numeric_or_symbol':
      return { kind: 'text', hint: info.value };
    default:
      return { kind: 'text' };
  }
};

/** Whether the value is the default the controller documents (booleans in any case). */
export const isDefault = (value: string | undefined, info?: PropertyInfo): boolean =>
  value !== undefined && info?.dflt !== undefined && value.toLowerCase() === info.dflt.toLowerCase();

/**
 * Whether the GUI offers to change or remove the property: the controller
 * documents it, or it is the user's own (Aux/). Everything else (encryption
 * keys, connector definitions, the cluster ID) is the controller's own state.
 */
export const isEditable = (key: string, info?: PropertyInfo): boolean => key.startsWith('Aux/') || !!info;

/** A case-insensitive match on the name or the description. */
export const matches = (search: string, key: string, info?: PropertyInfo): boolean => {
  const needle = search.trim().toLowerCase();
  return !needle || key.toLowerCase().includes(needle) || !!info?.info?.toLowerCase().includes(needle);
};
