// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

const useIsAdmin = (): boolean => {
  const storedValue = localStorage.getItem('linstorname');
  return storedValue === 'admin';
};

export default useIsAdmin;
