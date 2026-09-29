// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useSettings } from '@app/features/settings/useSettings';

const useKVStore = () => {
  const { KVS } = useSettings();

  return KVS;
};

export default useKVStore;
