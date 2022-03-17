import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';
import { useDispatch, useSelector } from 'react-redux';
import { ComposableTableSortableCustom } from './List';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['iscsi', 'common']);
  const dispatch = useDispatch<Dispatch>();
  const { list } = useSelector((state: RootState) => ({
    list: state.iscsi.list,
  }));

  useEffect(() => {
    dispatch.iscsi.getList({ page: 1, pageSize: 10 });
  }, [dispatch.iscsi]);

  console.log(list, 'list...');

  return (
    <PageBasic title={t('iscsi:list')} alerts={[]}>
      <ComposableTableSortableCustom list={list} />
    </PageBasic>
  );
};

export default List;
