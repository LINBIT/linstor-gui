// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { USER_LOCAL_STORAGE_KEY, DEFAULT_ADMIN_USER_NAME } from '@app/const/settings';

const useIsAdmin = (): boolean => {
  try {
    const storedValue = localStorage.getItem(USER_LOCAL_STORAGE_KEY);
    return storedValue === DEFAULT_ADMIN_USER_NAME;
  } catch {
    // If localStorage is not available or throws an error, default to false
    return false;
  }
};

export default useIsAdmin;
