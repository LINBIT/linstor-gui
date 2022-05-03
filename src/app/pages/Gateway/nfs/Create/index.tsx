import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import NFSForm from '../Form';

const CreateNFS: React.FunctionComponent = () => {
  const { t } = useTranslation(['nfs', 'common']);
  const dispatch = useDispatch<Dispatch>();
  const history = useHistory();

  const { loading } = useSelector((state: RootState) => ({
    loading: state.loading.effects.nfs.createNFS,
  }));

  const handleAdd = useCallback(
    async (NFS) => {
      const res = await dispatch.nfs.createNFS(NFS);
      if (res) {
        history.push(`/gateway/nfs`);
      }
    },
    [dispatch.nfs, history]
  );

  return (
    <PageBasic title={t('nfs:create')}>
      <NFSForm handleSubmit={handleAdd} loading={loading} />
    </PageBasic>
  );
};

export default CreateNFS;
