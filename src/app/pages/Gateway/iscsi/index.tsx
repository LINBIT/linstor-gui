// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

import { Button } from '@app/components/Button';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import { ISCSIList as ISCSIListV2, ISCSIResource } from '@app/features/gateway';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['iscsi', 'common']);
  const dispatch = useDispatch<Dispatch>();

  const navigate = useNavigate();

  const { list, loading } = useSelector((state: RootState) => ({
    list: state.iscsi.list,
    loading: state.loading.effects.iscsi.getList,
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

  const handleReload = () => {
    dispatch.iscsi.getList({});
  };

  return (
    <PageBasic title={t('iscsi:list')}>
      <Space style={{ marginBottom: '1rem' }}>
        <Button type="primary" onClick={createISCSI}>
          {t('common:create')}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReload} loading={loading}>
          {t('common:reload')}
        </Button>
      </Space>
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
