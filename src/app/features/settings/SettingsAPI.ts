import { authAPI } from '../authentication';
import { KeyValueStore, kvStore } from '../keyValueStore';

import { SettingsProps } from './types';

export class SettingsAPI {
  private store: KeyValueStore;
  static instance = '__gui__settings';

  constructor() {
    this.store = kvStore;
  }

  // check if instance exists
  public static async instanceExists(): Promise<boolean> {
    const response = await kvStore.listInstances();
    return response.includes(this.instance);
  }

  public static async init(): Promise<void> {
    if (!(await kvStore.instanceExists(SettingsAPI.instance))) {
      const props: SettingsProps = {
        gatewayEnabled: false,
        dashboardEnabled: false,
        gatewayCustomHost: '',
        gatewayHostAddress: '',
        dashboardHost: '',
        authenticationEnabled: true, // TODO: how do we handle this?
      };
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

      // TODO: create users instance
      await kvStore.create('users', {
        override_props: {
          __updated__: new Date().toISOString(),
        },
      });

      // TODO: create super admin
      await authAPI.register({
        username: 'admin',
        password: 'admin',
      });
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
        gatewayHostAddress,
        dashboardHost,
        authenticationEnabled,
        customLogoEnabled,
      } = storeProps.props;
      if (gatewayEnabled !== undefined) props.gatewayEnabled = gatewayEnabled === 'true';
      if (dashboardEnabled !== undefined) props.dashboardEnabled = dashboardEnabled === 'true';
      if (gatewayCustomHost !== undefined) props.gatewayCustomHost = gatewayCustomHost;
      if (gatewayHostAddress !== undefined) props.gatewayHostAddress = gatewayHostAddress;
      if (dashboardHost !== undefined) props.dashboardHost = dashboardHost;
      if (authenticationEnabled !== undefined) props.authenticationEnabled = authenticationEnabled === 'true';
      if (customLogoEnabled !== undefined) props.customLogoEnabled = customLogoEnabled === 'true';
    }
    return props;
  }

  public async setProps(props: Partial<SettingsProps>): Promise<void> {
    const storeProps: { override_props: Record<string, string>; delete_props: string[] } = {
      override_props: {},
      delete_props: [],
    };
    if (props.gatewayEnabled !== undefined) storeProps.override_props.gatewayEnabled = props.gatewayEnabled.toString();
    if (props.dashboardEnabled !== undefined)
      storeProps.override_props.dashboardEnabled = props.dashboardEnabled.toString();
    if (props.gatewayCustomHost !== undefined) {
      if (props.gatewayEnabled && props.gatewayCustomHost === '') {
        throw new Error('gatewayCustomHost must be a non-empty string when gatewayEnabled is true');
      }
      storeProps.override_props.gatewayCustomHost = props.gatewayCustomHost;
    }
    if (props.gatewayHostAddress !== undefined) {
      if (props.gatewayCustomHost === '') {
        throw new Error('gatewayCustomHost must be a non-empty string before gatewayHostAddress can be set');
      }
      storeProps.override_props.gatewayHostAddress = props.gatewayHostAddress;
    }
    if (props.dashboardHost !== undefined) storeProps.override_props.dashboardHost = props.dashboardHost;
    if (props.authenticationEnabled !== undefined)
      storeProps.override_props.authenticationEnabled = props.authenticationEnabled.toString();
    storeProps.override_props.__updated__ = new Date().toISOString();
    // handle logo
    if (props.customLogoEnabled !== undefined) {
      storeProps.override_props.customLogoEnabled = props.customLogoEnabled.toString();
    }

    const response = await this.store.modify(SettingsAPI.instance, storeProps);
    if (!response.every((e) => e.ret_code > 0)) {
      throw new Error(`Failed to set properties of key value store ${SettingsAPI.instance}`);
    }
  }

  public static async clear(): Promise<void> {
    await kvStore.delete(SettingsAPI.instance);
  }
}

export default new SettingsAPI();
