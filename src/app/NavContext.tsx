// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { usePersistentMenuState } from '@app/hooks';
import { NavContext } from '@app/hooks/useNav';
import React, { PropsWithChildren } from 'react';

export const NavProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [isNavOpen, setIsNavOpen] = usePersistentMenuState(true);

  const toggleNav = () => {
    setIsNavOpen((prev) => !prev);
  };

  return <NavContext.Provider value={{ isNavOpen, toggleNav }}>{children}</NavContext.Provider>;
};
