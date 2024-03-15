import service from '@app/requests';
import { PhysicalStorageList } from '@app/interfaces/storagePools';

const fetchPhysicalStorageList = (node: string): Promise<{ data: PhysicalStorageList }> =>
  service.get<{ node: string }, { data: PhysicalStorageList }>(`/v1/physical-storage/${node}`);

export { fetchPhysicalStorageList };
