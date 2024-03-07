import service from '@app/requests';
import { ISCSIResource, NFSResource, NVMEOFResource } from './types';

const getNetWorkInterfaces = () => {
  return service.get('/api/frontend/v1/system/interfaces');
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

export { getNetWorkInterfaces, createNFSExport, createISCSIExport, createNVMEExport, getResourceGroups };
