// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { usePersistentMenuState } from '@app/hooks';
import React, { createContext, useContext, PropsWithChildren } from 'react';

interface NavContextProps {
  isNavOpen: boolean;
  toggleNav: () => void;
}

const NavContext = createContext<NavContextProps | undefined>(undefined);

export const useNav = () => {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return context;
};

export const NavProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [isNavOpen, setIsNavOpen] = usePersistentMenuState(true);

  const toggleNav = () => {
    setIsNavOpen((prev) => !prev);
  };

  return <NavContext.Provider value={{ isNavOpen, toggleNav }}>{children}</NavContext.Provider>;
};
