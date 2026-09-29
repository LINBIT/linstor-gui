// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';

import { NFSList as NFSListV2 } from '@app/features/gateway';
import { NFSResource } from '@app/features/gateway/types';
import { useGatewayResources } from '@app/features/gateway/hooks/useGatewayResources';
import { useNavigate } from 'react-router-dom';

const nameOf = (resource: NFSResource) => resource.name;

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['nfs', 'common']);

  const navigate = useNavigate();

  const { list, loading, reload, start, stop, remove } = useGatewayResources<NFSResource>('nfs', nameOf);

  const createNFS = () => {
    navigate(`/gateway/nfs/create`);
  };

  const handleStart = (name: string) => {
    start(name);
  };

  const handleStop = (name: string) => {
    stop(name);
  };

  return (
    <PageBasic title={t('nfs:list')}>
      <NFSListV2
        onCreate={createNFS}
        list={list}
        handleDelete={remove}
        onDeleted={reload}
        handleStart={handleStart}
        handleStop={handleStop}
        loading={loading}
      />
    </PageBasic>
  );
};

export default List;
