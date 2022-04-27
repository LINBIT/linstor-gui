import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@patternfly/react-core';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import { ISCSIList } from './List';
import { useHistory } from 'react-router-dom';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['iscsi', 'common']);
  const dispatch = useDispatch<Dispatch>();

  const history = useHistory();

  const { list } = useSelector((state: RootState) => ({
    list: state.iscsi.list,
  }));

  useEffect(() => {
    dispatch.iscsi.getList({});
  }, [dispatch.iscsi]);

  const createISCSI = () => {
    history.push(`/gateway/iscsi/create`);
  };

  const handleDelete = (iqn: string) => {
    dispatch.iscsi.deleteISCSI(iqn);
  };

  const handleStart = (iqn: string) => {
    dispatch.iscsi.startISCSI(iqn);
  };

  console.log(list, 'list...');

  return (
    <PageBasic title={t('iscsi:list')}>
      <Button variant="primary" onClick={createISCSI}>
        Create
      </Button>
      <ISCSIList list={list} handleDelete={handleDelete} handleStart={handleStart} />
    </PageBasic>
  );
};

export default List;
