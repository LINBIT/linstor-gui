// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

export const clusterPrivateVolumeSizeKib = 64 * 1024;

/**
 * The query key of the VSAN backend's storage pools. Not 'getStoragePool':
 * the dashboard caches the LINSTOR storage pool list under that one, and the
 * two shapes cannot stand in for each other (a page that read the other's
 * data threw and blanked the GUI).
 */
export const vsanStoragePoolsKey = ['vsanStoragePools'];
