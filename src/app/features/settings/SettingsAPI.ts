// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { GUI_KEY_VALUE_STORE_KEY } from '@app/const/settings';
import { authAPI } from '../authentication';
import { KeyValueStoreType, kvStore } from '../keyValueStore';

// Field definitions for better maintainability
export const SETTINGS_FIELDS = {
  BOOLEAN: [
    'gatewayEnabled',
    'dashboardEnabled',
    'gatewayCustomHost',
    'vsanMode',
    'authenticationEnabled',
    'customLogoEnabled',
    'hideDefaultCredential',
  ] as const,

  STRING: ['dashboardURL', 'gatewayHost'] as const,
} as const;

// Type inference from field definitions
type BooleanField = (typeof SETTINGS_FIELDS.BOOLEAN)[number];
type StringField = (typeof SETTINGS_FIELDS.STRING)[number];

// Define the FieldType using the field definitions
export type SettingsProps = {
  [K in BooleanField]: boolean;
} & {
  [K in StringField]: string;
};

// Validation rules type and definitions
type ValidationRule = {
  condition: (props: Partial<SettingsProps>) => boolean;
  message: string;
};

const VALIDATION_RULES: ValidationRule[] = [
  {
    condition: (props) => Boolean(props.gatewayEnabled && props.gatewayCustomHost === undefined),
    message: 'gatewayCustomHost must be defined when gatewayEnabled is true',
  },
  {
    condition: (props) => Boolean(props.gatewayHost !== undefined && !props.gatewayCustomHost),
    message: 'gatewayCustomHost must be true before gatewayHost can be set',
  },
];

export class SettingsAPI {
  private store: KeyValueStoreType;
  static instance = GUI_KEY_VALUE_STORE_KEY;

  constructor() {
    this.store = kvStore;
  }

  public static async instanceExists(): Promise<boolean> {
    const response = await kvStore.listInstances();
    return response.includes(this.instance);
  }

  public static async init(vsanMode: boolean): Promise<void> {
    const defaultSettings: SettingsProps = {
      gatewayEnabled: false,
      dashboardEnabled: false,
      gatewayCustomHost: false,
      vsanMode,
      dashboardURL: '',
      authenticationEnabled: false,
      customLogoEnabled: false,
      hideDefaultCredential: false,
      gatewayHost: '',
    };

    if (!(await kvStore.instanceExists(SettingsAPI.instance))) {
      const serializedSettings = this.serializeSettings(defaultSettings);
      await kvStore.modify(SettingsAPI.instance, {
        override_props: {
          ...serializedSettings,
          __updated__: new Date().toISOString(),
        },
        delete_props: [],
      });
    }

    if (!(await kvStore.instanceExists(authAPI.usersInstance))) {
      authAPI.initUserStore();
    }
  }

  private static serializeSettings(settings: Partial<SettingsProps>): Record<string, string> {
    return Object.entries(settings).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value?.toString() ?? '',
      }),
      {},
    );
  }

  private getFieldType(field: keyof SettingsProps): 'boolean' | 'string' {
    if (SETTINGS_FIELDS.BOOLEAN.includes(field as BooleanField)) return 'boolean';
    if (SETTINGS_FIELDS.STRING.includes(field as StringField)) return 'string';
    throw new Error(`Unknown field type for field: ${field}`);
  }

  private deserializeValue<T extends keyof SettingsProps>(
    field: T,
    value: string | undefined,
  ): SettingsProps[T] | undefined {
    if (value === undefined) return undefined;

    const fieldType = this.getFieldType(field);
    return fieldType === 'boolean' ? ((value === 'true') as SettingsProps[T]) : (value as SettingsProps[T]);
  }

  public async getProps(): Promise<SettingsProps> {
    const storeProps = await this.store.get(SettingsAPI.instance);
    if (!storeProps?.props) {
      return {} as SettingsProps;
    }

    const result = {} as SettingsProps;

    Object.entries(storeProps.props).forEach(([key, value]) => {
      if (key === '__updated__') return;

      const field = key as keyof SettingsProps;
      const deserializedValue = this.deserializeValue(field, value);
      if (deserializedValue !== undefined) {
        (result[field] as any) = deserializedValue;
      }
    });

    return result;
  }

  private validateProps(props: Partial<SettingsProps>): void {
    const failedRule = VALIDATION_RULES.find((rule) => rule.condition(props));
    if (failedRule) {
      throw new Error(failedRule.message);
    }
  }

  public async setProps(props: Partial<SettingsProps>): Promise<boolean> {
    this.validateProps(props);

    const serializedProps = SettingsAPI.serializeSettings(props);

    const response = await this.store.modify(SettingsAPI.instance, {
      override_props: {
        ...serializedProps,
        __updated__: new Date().toISOString(),
      },
      delete_props: [],
    });

    return response.every((e) => e.ret_code > 0);
  }

  public static async clear(): Promise<void> {
    await kvStore.delete(SettingsAPI.instance);
  }
}

export default new SettingsAPI();
