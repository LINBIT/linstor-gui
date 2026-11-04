// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { MutationCache, QueryClient } from '@tanstack/react-query';

import { reportUnhandledError } from '@app/utils/unhandledError';

/**
 * The app's query client. A mutation that fails without an onError of its
 * own would otherwise fail silently: the user clicks Submit and nothing
 * happens. A mutation whose callers report its errors themselves (an onError
 * passed to mutate(), a try/catch around mutateAsync()) sets
 * meta.reportsErrors, which the cache cannot see otherwise.
 */
export const createQueryClient = () =>
  new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.options.onError || mutation.meta?.reportsErrors) return;
        reportUnhandledError(error);
      },
    }),
  });
