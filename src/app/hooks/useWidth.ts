// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { createContext, useContext } from 'react';

export interface WidthContextProps {
  width: number;
}

export const WidthContext = createContext<WidthContextProps>({ width: 0 });

export const useWidth = () => useContext(WidthContext);
