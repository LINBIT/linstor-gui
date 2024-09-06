// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import service from '@app/requests';
import { ISCSIResource, NFSResource, NVMEOFResource } from './types';

const getNetWorkInterfaces = () => {
  return service.get('/api/frontend/v1/system/interfaces');
};

const getNFSList = () => {
  return service.get<undefined, NFSResource[]>('/api/v2/nfs');
};

const createNFSExport = (data: NFSResource) => {
  return service.post('/api/v2/nfs', data);
};

const createISCSIExport = (data: ISCSIResource) => {
  return service.post('/api/v2/iscsi', data);
};

const createNVMEExport = (data: NVMEOFResource) => {
  return service.post('/api/v2/nvme-of', data);
};

const getResourceGroups = () => {
  return service.get('/api/frontend/v1/linstor/resource-groups');
};

export { getNetWorkInterfaces, createNFSExport, createISCSIExport, createNVMEExport, getResourceGroups, getNFSList };
