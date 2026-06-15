// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

export const CLUSTER_SETUP_DISMISSED_KEY = 'LINSTOR_GUI_CLUSTER_SETUP_DISMISSED';

export const getDismissed = (): boolean => {
  try {
    return window.localStorage.getItem(CLUSTER_SETUP_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setDismissed = (dismissed: boolean): void => {
  try {
    if (dismissed) {
      window.localStorage.setItem(CLUSTER_SETUP_DISMISSED_KEY, 'true');
    } else {
      window.localStorage.removeItem(CLUSTER_SETUP_DISMISSED_KEY);
    }
  } catch {
    // localStorage may be unavailable (private mode) — silently ignore.
  }
};
