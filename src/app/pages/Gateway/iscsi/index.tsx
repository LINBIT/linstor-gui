import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dispatch } from '@app/store';
import PageBasic from '@app/components/PageBasic';
import { useDispatch } from 'react-redux';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['iscsi', 'common']);
  const dispatch = useDispatch<Dispatch>();

  useEffect(() => {
    dispatch.iscsi.getList({ page: 1, pageSize: 10 });
  }, [dispatch.iscsi]);

  return <PageBasic title={t('iscsi:list')} alerts={[]}></PageBasic>;
};

export default List;
