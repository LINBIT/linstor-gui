// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { createContext, useContext, useState, useEffect, useCallback, PropsWithChildren } from 'react';
import { useNav } from '@app/NavContext';

interface WidthContextProps {
  width: number;
}

const WidthContext = createContext<WidthContextProps>({ width: 0 });

export const useWidth = () => useContext(WidthContext);

export const WidthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [width, setWidth] = useState(0);
  const { isNavOpen } = useNav();

  const updateWidth = useCallback(() => {
    const mainContentElement = document.querySelector('.content');
    if (mainContentElement) {
      setWidth(mainContentElement.clientWidth);
    }
  }, []);

  useEffect(() => {
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [updateWidth]);

  useEffect(() => {
    updateWidth();
  }, [isNavOpen, updateWidth]);

  return <WidthContext.Provider value={{ width }}>{children}</WidthContext.Provider>;
};
