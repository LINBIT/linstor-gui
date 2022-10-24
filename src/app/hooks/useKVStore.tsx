import { RootState } from '@app/store';
import { useSelector } from 'react-redux';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const useKVStore = () => {
  const { KVS } = useSelector((state: RootState) => ({
    KVS: state.setting.KVS,
  }));

  return { KVS };
};

export default useKVStore;
