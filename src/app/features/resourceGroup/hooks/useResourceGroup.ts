import { useQuery } from '@tanstack/react-query';
import { getResourceGroups } from '../api';
import { ResourceGroupQuery } from '../types';
import { DefaultResourceGroup } from '../const';

const useResourceGroups = ({ query, excludeDefault }: { query?: ResourceGroupQuery; excludeDefault?: boolean }) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['getResourceGroups', query],
    queryFn: () => getResourceGroups(query),
  });

  const result = excludeDefault ? data?.data?.filter((e) => e.name !== DefaultResourceGroup) : data?.data;

  return {
    isLoading,
    error,
    data: result,
  };
};

export { useResourceGroups };
