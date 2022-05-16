import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import ISCSIForm from '../Form';

const CreateISCSI: React.FunctionComponent = () => {
  const { t } = useTranslation(['nvme', 'common']);
  const dispatch = useDispatch<Dispatch>();
  const history = useHistory();

  const { loading } = useSelector((state: RootState) => ({
    loading: state.loading.effects.nvme.createNvme,
  }));

  const handleAdd = useCallback(
    async (nvme) => {
      const res = await dispatch.nvme.createNvme(nvme);
      if (res) {
        history.push(`/gateway/nvme-of`);
      }
    },
    [dispatch.nvme, history]
  );

  return (
    <PageBasic title={t('nvme:create')}>
      <ISCSIForm handleSubmit={handleAdd} loading={loading} />
    </PageBasic>
  );
};

export default CreateISCSI;
