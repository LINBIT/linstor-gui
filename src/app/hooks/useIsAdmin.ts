// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

const useIsAdmin = (): boolean => {
  try {
    const storedValue = localStorage.getItem('linstorname');
    return storedValue === 'admin';
  } catch {
    // If localStorage is not available or throws an error, default to false
    return false;
  }
};

export default useIsAdmin;
