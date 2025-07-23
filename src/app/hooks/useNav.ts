// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { createContext, useContext } from 'react';

export interface NavContextProps {
  isNavOpen: boolean;
  toggleNav: () => void;
}

export const NavContext = createContext<NavContextProps | undefined>(undefined);

export const useNav = () => {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return context;
};
