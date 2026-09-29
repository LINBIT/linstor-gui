// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';

import { ISCSIList as ISCSIListV2, ISCSIResource } from '@app/features/gateway';
import { useGatewayResources } from '@app/features/gateway/hooks/useGatewayResources';

const iqnOf = (resource: ISCSIResource) => resource.iqn;

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['iscsi', 'common']);

  const navigate = useNavigate();

  const { list, loading, reload, start, stop, remove, addLUN, addingVolume, deleteLUN } =
    useGatewayResources<ISCSIResource>('iscsi', iqnOf);

  const createISCSI = () => {
    navigate(`/gateway/iscsi/create`);
  };

  const handleStart = (iqn: string) => {
    start(iqn);
  };

  const handleStop = (iqn: string) => {
    stop(iqn);
  };

  const handleDeleteVolume = (iqn: string, lun: number) => {
    deleteLUN(iqn, lun);
  };

  const handleAddVolume = (iqn: string, lun: number, sizeKib: number) => {
    addLUN({ id: iqn, lun, sizeKib });
  };

  return (
    <PageBasic title={t('iscsi:list')}>
      <ISCSIListV2
        onCreate={createISCSI}
        list={list}
        handleDelete={remove}
        onDeleted={reload}
        handleStart={handleStart}
        handleStop={handleStop}
        handleDeleteVolume={handleDeleteVolume}
        handleAddVolume={handleAddVolume}
        addingVolume={addingVolume}
        loading={loading}
      />
    </PageBasic>
  );
};

export default List;
