import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import ISCSIForm from '../Form';

const CreateISCSI: React.FunctionComponent = () => {
  const { t } = useTranslation(['iscsi', 'common']);
  const dispatch = useDispatch<Dispatch>();
  const history = useHistory();

  const { loading } = useSelector((state: RootState) => ({
    loading: state.loading.effects.iscsi.createISCSI,
  }));

  useEffect(() => {
    dispatch.resourceGroup.getList({});
  }, [dispatch.resourceGroup]);

  const handleAdd = useCallback(
    async (iscsi) => {
      const res = await dispatch.iscsi.createISCSI(iscsi);
      if (res) {
        history.push(`/gateway/iscsi`);
      }
    },
    [dispatch.iscsi, history]
  );

  return (
    <PageBasic title={t('iscsi:create')}>
      <ISCSIForm handleSubmit={handleAdd} loading={loading} />
    </PageBasic>
  );
};

export default CreateISCSI;
