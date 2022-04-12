import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';
import { useDispatch, useSelector } from 'react-redux';

import ISCSIForm from '../Form';

const CreateISCSI: React.FunctionComponent = () => {
  const { t } = useTranslation(['iscsi', 'common']);
  const dispatch = useDispatch<Dispatch>();
  const { list } = useSelector((state: RootState) => ({
    list: state.iscsi.list,
  }));

  useEffect(() => {
    dispatch.iscsi.getList({ page: 1, pageSize: 10 });
  }, [dispatch.iscsi]);

  return (
    <PageBasic title={t('iscsi:create')} alerts={[]}>
      <ISCSIForm
        handleSubmit={function (node: any): void {
          console.log(node, 'node');
        }}
      />
    </PageBasic>
  );
};

export default CreateISCSI;
