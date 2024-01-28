import { useQuery } from '@tanstack/react-query';
import { getNodesFromVSAN } from '../api';
import { NodeListQuery } from '../types';

const useNodesFromVSAN = (query?: NodeListQuery) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['getNodesFromVSAN', query],
    queryFn: () => getNodesFromVSAN(),
  });

  return {
    isLoading,
    error,
    data: data?.data,
  };
};

export { useNodesFromVSAN };
