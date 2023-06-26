import { useQuery } from '@tanstack/react-query';
import { getResourceGroups } from '../api';
import { ResourceGroupQuery } from '../types';

const useResourceGroups = (query?: ResourceGroupQuery) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['getResourceGroups', query],
    queryFn: () => getResourceGroups(query),
  });

  return {
    isLoading,
    error,
    data: data?.data,
  };
};

export { useResourceGroups };
