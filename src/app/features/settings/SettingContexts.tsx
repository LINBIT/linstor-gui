import React, { createContext, useState, useEffect, useContext } from 'react';
import { SettingsAPI } from './SettingsAPI';

interface SettingsProps {
  gatewayEnabled?: boolean;
  dashboardEnabled?: boolean;
  gatewayCustomHost?: string;
  vsanMode?: string;
  dashboardURL?: string;
  authenticationEnabled?: boolean;
}

interface SettingsContextProps extends SettingsProps {
  updateSettings: (props: Partial<SettingsProps>) => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextProps>({
  updateSettings: () => Promise.resolve(),
});

SettingsContext.displayName = 'SettingsContext';

export const useSettings = () => useContext(SettingsContext);

const settingsAPI = new SettingsAPI();

const SettingsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsProps>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const props = await settingsAPI.getProps();
      setSettings(props);
    };

    fetchSettings();
  }, []);

  const updateSettings = async (props: Partial<SettingsProps>): Promise<void> => {
    const updatedSettings = { ...settings, ...props };
    await settingsAPI.setProps(updatedSettings);
    setSettings(updatedSettings);
  };

  return <SettingsContext.Provider value={{ ...settings, updateSettings }}>{children}</SettingsContext.Provider>;
};

export { SettingsProvider };
