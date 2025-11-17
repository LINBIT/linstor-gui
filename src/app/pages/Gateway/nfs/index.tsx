// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@app/components/Button';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import { NFSList as NFSListV2 } from '@app/features/gateway';
import { NFSResource } from '@app/features/gateway/types';
import { useNavigate } from 'react-router-dom';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['nfs', 'common']);
  const dispatch = useDispatch<Dispatch>();

  const navigate = useNavigate();

  const { list } = useSelector((state: RootState) => ({
    list: state.nfs.list,
  }));

  useEffect(() => {
    dispatch.nfs.getList();
  }, [dispatch.nfs]);

  const createNFS = () => {
    navigate(`/gateway/nfs/create`);
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
      <Button
        type="primary"
        onClick={createNFS}
        style={{
          marginBottom: '1em',
        }}
        disabled={list.length >= 1}
      >
        {t('common:create')}
      </Button>
      <NFSListV2
        list={list as NFSResource[]}
        handleDelete={handleDelete}
        handleStart={handleStart}
        handleStop={handleStop}
      />
    </PageBasic>
  );
};

export default List;
