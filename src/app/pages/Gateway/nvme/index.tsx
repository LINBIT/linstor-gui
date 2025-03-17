// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'antd';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import { NVMeList as NVMeListV2 } from '@app/features/gateway';
import { useNavigate } from 'react-router-dom';

const List = () => {
  const { t } = useTranslation(['nvme', 'common']);
  const dispatch = useDispatch<Dispatch>();

  const navigate = useNavigate();

  const { list } = useSelector((state: RootState) => ({
    list: state.nvme.list,
  }));

  useEffect(() => {
    dispatch.nvme.getList({});
  }, [dispatch.nvme]);

  const createISCSI = () => {
    navigate(`/gateway/nvme-of/create`);
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
      <Button
        type="primary"
        onClick={createISCSI}
        style={{
          marginBottom: '1rem',
        }}
      >
        {t('common:create')}
      </Button>

      <NVMeListV2
        list={list as any}
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
