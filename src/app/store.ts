// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import loadingPlugin, { ExtraModelsFromLoading } from '@rematch/loading';
import { init, RematchDispatch, RematchRootState } from '@rematch/core';
import { models, RootModel } from './models';

type FullModel = ExtraModelsFromLoading<RootModel>;
export const store = init<RootModel, FullModel>({
  models,
  plugins: [loadingPlugin()],
});

export type Store = typeof store;
export type Dispatch = RematchDispatch<RootModel>;
export type RootState = RematchRootState<RootModel, FullModel>;
