// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState, useEffect } from 'react';
// "VSAN" UIMode is for vSAN UI
// "HCI" UIMode is for HCI UI
// "NORMAL" UIMode is for other UI
// UI modes: VSAN UI, NORMAL UI, or HCI UI
export type Mode = 'VSAN' | 'NORMAL' | 'HCI';

const useUIModeStorage = () => {
  // Get UIMode from localStorage

  // Initialize UIMode from localStorage, default to NORMAL if invalid
  const [UIMode, setUIMode] = useState<Mode>(() => {
    const storedUIMode = localStorage.getItem('__gui__mode');
    if (storedUIMode === 'NORMAL') return 'NORMAL';
    if (storedUIMode === 'HCI') return 'HCI';
    return 'NORMAL';
  });

  useEffect(() => {
    localStorage.setItem('__gui__mode', UIMode);
  }, [UIMode]);

  const updateUIMode = (newMode: Mode) => {
    setUIMode(newMode);
  };

  return {
    UIMode,
    updateUIMode,
  };
};

export default useUIModeStorage;
