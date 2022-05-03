import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@patternfly/react-core';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import { NFSList } from './List';
import { useHistory } from 'react-router-dom';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['nfs', 'common']);
  const dispatch = useDispatch<Dispatch>();

  const history = useHistory();

  const { list } = useSelector((state: RootState) => ({
    list: state.nfs.list,
  }));

  useEffect(() => {
    dispatch.nfs.getList({});
  }, [dispatch.nfs]);

  const createNFS = () => {
    history.push(`/gateway/nfs/create`);
  };

  const handleDelete = (iqn: string) => {
    dispatch.nfs.deleteNFS(iqn);
  };

  const handleStart = (iqn: string) => {
    dispatch.nfs.startNFS(iqn);
  };

  const handleStop = (iqn: string) => {
    dispatch.nfs.stopNFS(iqn);
  };

  return (
    <PageBasic title={t('nfs:list')}>
      <Button variant="primary" onClick={createNFS}>
        Create
      </Button>
      <NFSList list={list} handleDelete={handleDelete} handleStart={handleStart} handleStop={handleStop} />
    </PageBasic>
  );
};

export default List;
