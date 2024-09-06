// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { GUI_KEY_VALUE_STORE_KEY } from '@app/const/settings';
import { authAPI } from '../authentication';
import { KeyValueStoreType, kvStore } from '../keyValueStore';

import { SettingsProps } from './types';

export class SettingsAPI {
  private store: KeyValueStoreType;
  static instance = GUI_KEY_VALUE_STORE_KEY;

  constructor() {
    this.store = kvStore;
  }

  // check if instance exists
  public static async instanceExists(): Promise<boolean> {
    const response = await kvStore.listInstances();
    return response.includes(this.instance);
  }

  public static async init(vsanMode: boolean): Promise<void> {
    const props: SettingsProps = {
      gatewayEnabled: false,
      dashboardEnabled: false,
      gatewayCustomHost: false,
      vsanMode: false,
      dashboardURL: '',
      authenticationEnabled: false,
    };

    if (vsanMode) {
      props.vsanMode = true;
    }

    if (!(await kvStore.instanceExists(SettingsAPI.instance))) {
      const propsAsString: { [key: string]: string } = {};
      for (const [key, value] of Object.entries(props)) {
        propsAsString[key] = value?.toString() ?? '';
      }

      await kvStore.modify(SettingsAPI.instance, {
        override_props: {
          ...propsAsString,
          __updated__: new Date().toISOString(),
        },
        delete_props: [],
      });
    }

    if (!(await kvStore.instanceExists(authAPI.usersInstance))) {
      authAPI.initUserStore();
    }
  }

  public async getProps(): Promise<SettingsProps> {
    const props: SettingsProps = {};
    const storeProps = await this.store.get(SettingsAPI.instance);
    if (storeProps && storeProps.props) {
      const {
        gatewayEnabled,
        dashboardEnabled,
        gatewayCustomHost,
        vsanMode,
        dashboardURL,
        authenticationEnabled,
        customLogoEnabled,
        gatewayHost,
        hideDefaultCredential,
      } = storeProps.props;
      if (gatewayEnabled !== undefined) props.gatewayEnabled = gatewayEnabled === 'true';
      if (dashboardEnabled !== undefined) props.dashboardEnabled = dashboardEnabled === 'true';
      if (gatewayCustomHost !== undefined) props.gatewayCustomHost = gatewayCustomHost === 'true';
      if (vsanMode !== undefined) props.vsanMode = vsanMode === 'true';
      if (dashboardURL !== undefined) props.dashboardURL = dashboardURL;
      if (authenticationEnabled !== undefined) props.authenticationEnabled = authenticationEnabled === 'true';
      if (customLogoEnabled !== undefined) props.customLogoEnabled = customLogoEnabled === 'true';
      if (gatewayHost !== undefined) props.gatewayHost = gatewayHost;
      if (hideDefaultCredential !== undefined) props.hideDefaultCredential = hideDefaultCredential === 'true';
    }
    return props;
  }

  public async setProps(props: Partial<SettingsProps>): Promise<boolean> {
    const storeProps: { override_props: Record<string, string | undefined>; delete_props: string[] } = {
      override_props: {},
      delete_props: [],
    };
    if (props.gatewayEnabled !== undefined) storeProps.override_props.gatewayEnabled = props.gatewayEnabled.toString();
    if (props.dashboardEnabled !== undefined)
      storeProps.override_props.dashboardEnabled = props.dashboardEnabled.toString();
    if (props.gatewayCustomHost !== undefined) {
      if (props.gatewayEnabled && typeof props.gatewayCustomHost === 'undefined') {
        throw new Error('gatewayCustomHost must be a non-empty string when gatewayEnabled is true');
      }
      storeProps.override_props.gatewayCustomHost = props.gatewayCustomHost ? 'true' : 'false';
    }
    if (props.gatewayHost !== undefined) {
      if (props.gatewayCustomHost) {
        throw new Error('gatewayCustomHost must be a non-empty string before gatewayHost can be set');
      }
      storeProps.override_props.gatewayHost = props.gatewayHost;
    }
    if (props.dashboardURL !== undefined) storeProps.override_props.dashboardURL = props.dashboardURL;
    if (props.authenticationEnabled !== undefined)
      storeProps.override_props.authenticationEnabled = props.authenticationEnabled.toString();
    storeProps.override_props.__updated__ = new Date().toISOString();
    // handle logo
    if (props.customLogoEnabled !== undefined) {
      storeProps.override_props.customLogoEnabled = props.customLogoEnabled.toString();
    }

    if (props.vsanMode !== undefined) storeProps.override_props.vsanMode = props.vsanMode.toString();

    if (props.hideDefaultCredential !== undefined)
      storeProps.override_props.hideDefaultCredential = props.hideDefaultCredential.toString();

    const response = await this.store.modify(SettingsAPI.instance, storeProps);
    if (!response.every((e) => e.ret_code > 0)) {
      return false;
    } else {
      return true;
    }
  }

  public static async clear(): Promise<void> {
    await kvStore.delete(SettingsAPI.instance);
  }
}

export default new SettingsAPI();
