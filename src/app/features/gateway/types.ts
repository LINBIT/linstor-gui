// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { components } from '@app/apis/gatewayschema';

// `implementation` is not yet in the gateway OpenAPI spec, but the REST API
// serializes it (see linstor-gateway pkg/nfs ResourceConfig). It selects the
// NFS server backend: kernel (default) or NFS-Ganesha.
export type NFSImplementation = 'kernel' | 'ganesha';

export type NFSResource = components['schemas']['NFSResourceConfig'] & {
  implementation?: NFSImplementation;
};
export type ISCSIResource = components['schemas']['ISCSIResourceConfig'];
export type NVMEOFResource = components['schemas']['NvmeOfResourceConfig'];

export interface NetworkAddress {
  prefix: string;
  mask: number;
}
