// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import service from '@app/requests';
import { ISCSIResource, NFSResource, NVMEOFResource, ResourceGroup } from './types';

const getNodesFromVSAN = () => {
  return service.get('/api/frontend/v1/nodes?source=linstor');
};

const setNodeStandBy = (hostname: string, standby: boolean) => {
  return service.post(`/api/frontend/v1/nodes/${hostname}/standby`, {
    standby,
  });
};

const getNVMeoFTarget = () => {
  return service.get('/api/frontend/v1/nvme');
};

const getNFSExport = () => {
  return service.get('/api/frontend/v1/nfs');
};

const getISCSITarget = () => {
  return service.get('/api/frontend/v1/iscsi/targets');
};

const getNetWorkInterfaces = () => {
  return service.get('/api/frontend/v1/system/interfaces');
};

const createNFSExport = (data: NFSResource) => {
  return service.post('/api/frontend/v1/nfs', data);
};

const createISCSIExport = (data: ISCSIResource) => {
  return service.post('/api/frontend/v1/iscsi/targets', data);
};

const createNVMEExport = (data: NVMEOFResource) => {
  return service.post('/api/frontend/v1/nvme', data);
};

const getResourceGroups = () => {
  return service.get('/api/frontend/v1/linstor/resource-groups');
};

const deleteNVMeExport = (nqn: string) => {
  return service.delete(`/api/frontend/v1/nvme/${nqn}`);
};

const getPhysicalStorage = () => {
  return service.get('/api/frontend/v1/physical-storage');
};

const getStoragePool = () => {
  return service.get('/api/frontend/v1/linstor/storage-pools');
};

const createResourceGroup = (data: ResourceGroup) => {
  return service.post('/api/frontend/v1/linstor/resource-groups', data);
};

const deleteResourceGroup = (name: string) => {
  return service.delete(`/api/frontend/v1/linstor/resource-groups/${name}`);
};

const deleteNFSExport = (iqn: string) => {
  return service.delete(`/api/frontend/v1/nfs/${iqn}`);
};

const deleteISCISExport = (name: string) => {
  return service.delete(`/api/frontend/v1/iscsi/targets/${name}`);
};

const resizeTarget = (resource: string, data: { size: number }) => {
  return service.put(`/api/frontend/v1/linstor/resource/${resource}/resize`, data);
};

const createPool = (data) => {
  return service.post('/api/frontend/v1/linstor/physical-storage-pools', data);
};

export {
  getNetWorkInterfaces,
  createNFSExport,
  createISCSIExport,
  createNVMEExport,
  getResourceGroups,
  getNVMeoFTarget,
  getISCSITarget,
  getNFSExport,
  deleteNVMeExport,
  getNodesFromVSAN,
  setNodeStandBy,
  getPhysicalStorage,
  getStoragePool,
  createResourceGroup,
  deleteResourceGroup,
  resizeTarget,
  createPool,
  deleteNFSExport,
  deleteISCISExport,
};
