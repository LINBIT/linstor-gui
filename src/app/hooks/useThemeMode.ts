// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { createContext, useContext } from 'react';

import type { ThemeMode } from '@app/const/themeTokens';

interface ThemeModeContextProps {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

// Default keeps provider-less renders (tests) on the light theme.
export const ThemeModeContext = createContext<ThemeModeContextProps>({
  mode: 'light',
  setMode: () => undefined,
});

export const useThemeMode = () => useContext(ThemeModeContext);
