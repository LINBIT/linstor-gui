import { useQuery } from '@tanstack/react-query';
import { getNetWorkInterfaces } from '../api';

const useNodeNetWorkInterface = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['getNodes'],
    queryFn: () => getNetWorkInterfaces(),
  });

  return {
    isLoading,
    error,
    data: data?.data.filter((s) => s.prefix !== '127.'),
  };
};

export { useNodeNetWorkInterface };
