// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { getFaultyResources } from '@app/utils/resource';
import { useResourcesView } from './useResourcesView';

export const useFaultyResources = () => useResourcesView({ select: getFaultyResources });
