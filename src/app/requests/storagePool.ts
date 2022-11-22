import service from '@app/requests';
import { physicalStorageList } from '@app/interfaces/storagePools';

const fetchPhysicalStorageList = (node: string): Promise<{ data: physicalStorageList }> =>
  service.get<{ node: string }, { data: physicalStorageList }>(`/v1/physical-storage/${node}`);

export { fetchPhysicalStorageList };
