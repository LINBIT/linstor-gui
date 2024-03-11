import service from '@app/requests';
import { ISCSIResource, NFSResource, NVMEOFResource } from './types';

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
};
