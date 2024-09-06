// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState, useEffect } from 'react';
// VSAN Mode could be "VSAN" or "NORMAL"
// "VSAN" UIMode is for vSAN UI
// "NORMAL" UIMode is for other UI
export type Mode = 'VSAN' | 'NORMAL';

const useUIModeStorage = () => {
  // Get UIMode from localStorage

  const [UIMode, setUIMode] = useState<Mode>(() => {
    // default mode is "VSAN" if there is no mode in localStorage

    const storedUIMode = localStorage.getItem('__gui__mode');
    const initialMode = storedUIMode === 'NORMAL' ? 'NORMAL' : 'VSAN';
    return initialMode;
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
