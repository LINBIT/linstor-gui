import { useQuery } from '@tanstack/react-query';
import { getStoragePool } from '../api';
import { GetStoragePoolQuery } from '../types';

const useStoragePools = (query?: GetStoragePoolQuery) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['getStoragePool', query],
    queryFn: () => getStoragePool(query),
  });

  return {
    isLoading,
    error,
    data: data?.data,
  };
};

export { useStoragePools };
