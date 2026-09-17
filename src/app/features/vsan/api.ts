// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import service from '@app/requests';

/** What the physical-storage-pool endpoint takes: the request with its sets flattened. */
type PhysicalStoragePoolRequestBody = Omit<PhysicalStoragePoolRequest, 'diskPaths' | 'nodes'> & {
  diskPaths: Record<string, string[]>;
  nodes: string[];
};
import {
  CloudStackNode,
  Disk,
  ISCSIResource,
  ISCSITarget,
  NetworkAddress,
  NFSExport,
  NFSResource,
  Node,
  NVMEOFResource,
  NVMeTarget,
  PhysicalStoragePoolRequest,
  ResourceGroup,
  VsanResourceGroup,
  VsanStoragePool,
} from './types';

const getNodesFromVSAN = () => {
  return service.get<Node[]>('/api/frontend/v1/nodes?source=linstor');
};

const setNodeStandBy = (hostname: string, standby: boolean) => {
  return service.post(`/api/frontend/v1/nodes/${hostname}/standby`, {
    standby,
  });
};

// HCI maintenance status
const setNodeMaintenance = (hostname: string, maintenance: boolean) => {
  return service.post(`/api/frontend/v1/cloudstack/nodes/${hostname}/maintenance`, {
    maintenance,
  });
};

const getNVMeoFTarget = () => {
  return service.get<NVMeTarget[]>('/api/frontend/v1/nvme');
};

const getNFSExport = () => {
  return service.get<NFSExport[]>('/api/frontend/v1/nfs');
};

const getISCSITarget = () => {
  return service.get<ISCSITarget[]>('/api/frontend/v1/iscsi/targets');
};

const getNetWorkInterfaces = () => {
  return service.get<{ prefixes: NetworkAddress[] }>('/api/frontend/v1/system/interfaces');
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
  return service.get<VsanResourceGroup[]>('/api/frontend/v1/linstor/resource-groups');
};

const deleteNVMeExport = (nqn: string) => {
  return service.delete(`/api/frontend/v1/nvme/${nqn}`);
};

const getPhysicalStorage = () => {
  return service.get<Disk[]>('/api/frontend/v1/physical-storage');
};

const getStoragePool = () => {
  return service.get<VsanStoragePool[]>('/api/frontend/v1/linstor/storage-pools');
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

const createPool = (data: PhysicalStoragePoolRequestBody) => {
  return service.post('/api/frontend/v1/linstor/physical-storage-pools', data);
};

const getCloudStackNodes = () => {
  return service.get<CloudStackNode[]>('/api/frontend/v1/cloudstack/nodes');
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
  getCloudStackNodes,
  setNodeMaintenance,
};
