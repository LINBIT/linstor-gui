import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@patternfly/react-core';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import { ISCSIList } from './List';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['snapshot', 'common']);
  const dispatch = useDispatch<Dispatch>();

  const history = useHistory();

  const { list } = useSelector((state: RootState) => ({
    list: state.nvme.list,
  }));

  useEffect(() => {
    dispatch.snapshot.getList({});
  }, [dispatch.snapshot]);

  const handleAddVolume = (iqn: string, LUN: number, size_kib: number) => {
    dispatch.nvme.addLUN({
      iqn,
      LUN,
      size_kib,
    });
  };

  return (
    <PageBasic title={t('snapshot:list')}>
      <Button variant="primary" onClick={() => {}}>
        Create
      </Button>
    </PageBasic>
  );
};

export default List;
