import { useQuery } from '@tanstack/react-query';
import { getResourceDefinition } from '../api';
import { ResourceDefinitionListQuery } from '../types';

const useResourceDefinitions = (query?: ResourceDefinitionListQuery) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['getResources', query],
    queryFn: () => getResourceDefinition(query),
  });

  return {
    isLoading,
    error,
    data: data?.data,
  };
};

export { useResourceDefinitions };
