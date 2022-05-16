import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@patternfly/react-core';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import { ISCSIList } from './List';
import { useHistory } from 'react-router-dom';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['nvme', 'common']);
  const dispatch = useDispatch<Dispatch>();

  const history = useHistory();

  const { list } = useSelector((state: RootState) => ({
    list: state.nvme.list,
  }));

  useEffect(() => {
    dispatch.nvme.getList({});
  }, [dispatch.nvme]);

  const createISCSI = () => {
    history.push(`/gateway/nvme-of/create`);
  };

  const handleDelete = (nqn: string) => {
    dispatch.nvme.deleteNvme(nqn);
  };

  const handleStart = (nqn: string) => {
    dispatch.nvme.startNvme(nqn);
  };

  const handleStop = (nqn: string) => {
    dispatch.nvme.startNvme(nqn);
  };

  const handleDeleteVolume = (iqn: string, lun: number) => {
    dispatch.nvme.deleteLUN([iqn, lun]);
  };

  const handleAddVolume = (iqn: string, LUN: number, size_kib: number) => {
    dispatch.nvme.addLUN({
      iqn,
      LUN,
      size_kib,
    });
  };

  return (
    <PageBasic title={t('nvme:list')}>
      <Button variant="primary" onClick={createISCSI}>
        Create
      </Button>
      <ISCSIList
        list={list}
        handleDelete={handleDelete}
        handleStart={handleStart}
        handleStop={handleStop}
        handleDeleteVolume={handleDeleteVolume}
        handleAddVolume={handleAddVolume}
      />
    </PageBasic>
  );
};

export default List;
