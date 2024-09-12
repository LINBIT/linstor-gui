import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dispatch } from '@app/store';
import PageBasic from '@app/components/PageBasic';
import { useDispatch } from 'react-redux';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['linstor', 'common']);
  const dispatch = useDispatch<Dispatch>();

  useEffect(() => {
    dispatch.nfs.getNFSList({ page: 1, pageSize: 10 });
  }, [dispatch.nfs]);

  return <PageBasic title={t('linstor:list')} alerts={[]}></PageBasic>;
};

export default List;
