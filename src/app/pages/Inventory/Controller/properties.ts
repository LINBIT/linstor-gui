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

/** A property's group: the namespace before its first `/`, or OTHER_GROUP. */
export type GroupId = string;

/** Properties without a namespace. A namespace never contains `/`, so this key cannot clash with one. */
export const OTHER_GROUP: GroupId = '/';

/** The user's own properties, shown first. */
export const AUX_GROUP: GroupId = 'Aux';

/** Groups that start collapsed: the connector definitions and the names of the default ones. */
export const COLLAPSED_GROUPS: GroupId[] = ['NetCom', OTHER_GROUP];

export const groupOf = (key: string): GroupId => {
  const slash = key.indexOf('/');
  return slash > 0 ? key.slice(0, slash) : OTHER_GROUP;
};

/** Aux first, then the namespaces alphabetically, ignoring case, and OTHER_GROUP last. */
export const compareGroups = (a: GroupId, b: GroupId): number => {
  const rank = (id: GroupId) => (id === AUX_GROUP ? 0 : id === OTHER_GROUP ? 2 : 1);
  return rank(a) - rank(b) || a.localeCompare(b, undefined, { sensitivity: 'base' }) || a.localeCompare(b);
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
