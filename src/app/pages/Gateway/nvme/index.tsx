// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';

import { NVMeList as NVMeListV2 } from '@app/features/gateway';
import type { NVMEOFResource } from '@app/features/gateway/types';
import { useGatewayResources } from '@app/features/gateway/hooks/useGatewayResources';
import { useNavigate } from 'react-router-dom';

const nqnOf = (resource: NVMEOFResource) => resource.nqn;

const List = () => {
  const { t } = useTranslation(['nvme', 'common']);

  const navigate = useNavigate();

  const { list, loading, reload, start, stop, remove, addLUN, addingVolume, deleteLUN } =
    useGatewayResources<NVMEOFResource>('nvme-of', nqnOf);

  const createNVMeOf = () => {
    navigate(`/gateway/nvme-of/create`);
  };

  const handleStart = (nqn: string) => {
    start(nqn);
  };

  const handleStop = (nqn: string) => {
    stop(nqn);
  };

  const handleDeleteVolume = (nqn: string, lun: number) => {
    deleteLUN(nqn, lun);
  };

  const handleAddVolume = (nqn: string, lun: number, sizeKib: number) => {
    addLUN({ id: nqn, lun, sizeKib });
  };

  return (
    <PageBasic title={t('nvme:list')}>
      <NVMeListV2
        onCreate={createNVMeOf}
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
