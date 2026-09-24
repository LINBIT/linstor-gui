// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { TableProps } from 'antd';
import { components } from '@app/apis/gatewayschema';

/** The props antd hands a table's custom expand icon. */
export type ExpandIconProps<T> = Parameters<NonNullable<NonNullable<TableProps<T>['expandable']>['expandIcon']>>[0];

// `implementation` is not yet in the gateway OpenAPI spec, but the REST API
// serializes it (see linstor-gateway pkg/nfs ResourceConfig). It selects the
// NFS server backend: kernel (default) or NFS-Ganesha.
export type NFSImplementation = 'kernel' | 'ganesha';

// Like `implementation`, the per-volume export path and file system are sent
// by the gateway (and posted by CreateNFSForm) but missing from its spec.
export type NFSVolume = components['schemas']['VolumeConfig'] & {
  export_path?: string;
  file_system?: string;
};

export type NFSResource = Omit<components['schemas']['NFSResourceConfig'], 'volumes'> & {
  implementation?: NFSImplementation;
  volumes?: NFSVolume[];
};
export type ISCSIResource = components['schemas']['ISCSIResourceConfig'];
export type NVMEOFResource = components['schemas']['NvmeOfResourceConfig'];

export interface NetworkAddress {
  prefix: string;
  mask: number;
}
