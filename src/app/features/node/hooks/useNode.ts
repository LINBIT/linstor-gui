import { useQuery } from '@tanstack/react-query';
import { getNodes } from '../api';
import { NodeListQuery } from '../types';

const useNodes = (query?: NodeListQuery) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['getNodes', query],
    queryFn: () => getNodes(query),
  });

  return {
    isLoading,
    error,
    data: data?.data,
  };
};

export { useNodes };
