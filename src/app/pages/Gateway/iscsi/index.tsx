// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '@app/components/Button';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import { ISCSIList as ISCSIListV2, ISCSIResource } from '@app/features/gateway';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['iscsi', 'common']);
  const dispatch = useDispatch<Dispatch>();

  const navigate = useNavigate();

  const { list } = useSelector((state: RootState) => ({
    list: state.iscsi.list,
  }));

  useEffect(() => {
    dispatch.iscsi.getList({});
  }, [dispatch.iscsi]);

  const createISCSI = () => {
    navigate(`/gateway/iscsi/create`);
  };

  const handleDelete = (iqn: string) => {
    dispatch.iscsi.deleteISCSI(iqn);
  };

  const handleStart = (iqn: string) => {
    dispatch.iscsi.startISCSI(iqn);
  };

  const handleStop = (iqn: string) => {
    dispatch.iscsi.stopISCSI(iqn);
  };

  const handleDeleteVolume = (iqn: string, lun: number) => {
    dispatch.iscsi.deleteLUN([iqn, lun]);
  };

  const handleAddVolume = (iqn: string, LUN: number, size_kib: number) => {
    dispatch.iscsi.addLUN({
      iqn,
      LUN,
      size_kib,
    });
  };

  return (
    <PageBasic title={t('iscsi:list')}>
      <Button
        type="primary"
        onClick={createISCSI}
        style={{
          marginBottom: '1rem',
        }}
      >
        {t('common:create')}
      </Button>
      <ISCSIListV2
        list={list as ISCSIResource[]}
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
