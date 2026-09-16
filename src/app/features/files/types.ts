// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { components } from '@app/apis/schema';

export type ExternalFile = components['schemas']['ExternalFile'];
/** What the GUI sends: LINSTOR treats a missing alt_suffixes as none. */
export type ExternalFileBody = Omit<ExternalFile, 'alt_suffixes'> & Partial<Pick<ExternalFile, 'alt_suffixes'>>;
