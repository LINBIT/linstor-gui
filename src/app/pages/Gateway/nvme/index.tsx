// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { Button } from '@app/components/Button';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import { NVMeList as NVMeListV2 } from '@app/features/gateway';
import { useNavigate } from 'react-router-dom';

const List = () => {
  const { t } = useTranslation(['nvme', 'common']);
  const dispatch = useDispatch<Dispatch>();

  const navigate = useNavigate();

  const { list, loading } = useSelector((state: RootState) => ({
    list: state.nvme.list,
    loading: state.loading.effects.nvme.getList,
  }));

  useEffect(() => {
    dispatch.nvme.getList();
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
    dispatch.nvme.stopNvme(nqn);
  };

  const handleDeleteVolume = (nqn: string, lun: number) => {
    dispatch.nvme.deleteLUN([nqn, lun]);
  };

  const handleAddVolume = (nqn: string, LUN: number, size_kib: number) => {
    dispatch.nvme.addLUN({
      nqn,
      LUN,
      size_kib,
    });
  };

  const handleReload = () => {
    dispatch.nvme.getList();
  };

  return (
    <PageBasic title={t('nvme:list')}>
      <Space style={{ marginBottom: '1rem' }}>
        <Button type="primary" onClick={createISCSI}>
          {t('common:create')}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReload} loading={loading}>
          {t('common:reload')}
        </Button>
      </Space>

      <NVMeListV2
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
