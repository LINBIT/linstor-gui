// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { MIN_API_VERSION } from '@app/hooks/useLinstorVersion';
import { compareVersions } from '@app/utils/version';
import type { LINSTORVersionInfo } from './types';

/**
 * The machine the controller runs on: the host name it reports itself, else
 * the node where its HA resource is Primary.
 */
export const controllerActiveOn = (version: LINSTORVersionInfo | undefined, haActive: string | undefined) => {
  const hostName = compareVersions(version?.rest_api_version, MIN_API_VERSION.CONTROLLER_HOST_NAME)
    ? version?.host_name
    : undefined;
  return hostName || haActive;
};
