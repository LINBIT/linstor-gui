import service from '@app/requests';
import { ISCSIResource, NFSResource, NVMEOFResource } from './types';

const getNetWorkInterfaces = async () => {
  return service.get('/api/frontend/v1/system/interfaces');
};

const createNFSExport = async (data: NFSResource) => {
  return service.post('/api/v2/nfs', data);
};

const createiSCSIExport = async (data: ISCSIResource) => {
  return service.post('/api/v2/iscsi', data);
};

const createNVMEExport = async (data: NVMEOFResource) => {
  return service.post('/api/v2/nvme-of', data);
};

const getResourceGroups = async () => {
  return service.get('/api/frontend/v1/linstor/resource-groups');
};

export { getNetWorkInterfaces, createNFSExport, createiSCSIExport, createNVMEExport, getResourceGroups };
