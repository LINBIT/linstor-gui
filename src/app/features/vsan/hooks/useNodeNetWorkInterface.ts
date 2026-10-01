// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';
import { getNetWorkInterfaces } from '../api';

const useNodeNetWorkInterface = () => {
  const { isPending, error, data } = useQuery({
    queryKey: ['getNodes'],
    queryFn: () => getNetWorkInterfaces(),
  });

  return {
    isPending,
    error,
    data: data?.data?.prefixes?.filter((s) => s.prefix !== '127.'),
  };
};

export { useNodeNetWorkInterface };
