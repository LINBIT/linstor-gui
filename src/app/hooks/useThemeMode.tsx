// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';

import { getStoredThemeMode, setThemeMode, ThemeMode } from '@app/const/themeTokens';

interface ThemeModeContextProps {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

// Default keeps provider-less renders (tests) on the light theme.
const ThemeModeContext = createContext<ThemeModeContextProps>({
  mode: 'light',
  setMode: () => undefined,
});

/**
 * Holds the light/dark mode as React state so consumers (antd ConfigProvider,
 * charts) re-render on switch, and mirrors it to the DOM (`data-theme`
 * attribute driving the CSS custom properties) + localStorage.
 */
export const ThemeModeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(getStoredThemeMode);

  useEffect(() => {
    setThemeMode(mode);
  }, [mode]);

  return <ThemeModeContext.Provider value={{ mode, setMode }}>{children}</ThemeModeContext.Provider>;
};

export const useThemeMode = () => useContext(ThemeModeContext);
