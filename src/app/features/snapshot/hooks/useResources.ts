import { useQuery } from '@tanstack/react-query';
import { getAllResources } from '../api';
import { ResourceListQuery } from '../types';

const useResources = (query?: ResourceListQuery) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['getAllResources', query],
    queryFn: () => getAllResources(query),
  });

  return {
    isLoading,
    error,
    data: data?.data,
  };
};

export { useResources };
