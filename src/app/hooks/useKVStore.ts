// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { RootState } from '@app/store';
import { useSelector } from 'react-redux';

const useKVStore = () => {
  const KVS = useSelector((state: RootState) => ({
    ...state.setting.KVS,
  }));

  return KVS;
};

export default useKVStore;
