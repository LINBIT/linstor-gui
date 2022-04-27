import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@patternfly/react-core';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import { ComposableTableSortableCustom } from './List';
import { useHistory } from 'react-router-dom';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['iscsi', 'common']);
  const dispatch = useDispatch<Dispatch>();

  const history = useHistory();

  const { list } = useSelector((state: RootState) => ({
    list: state.iscsi.list,
  }));

  useEffect(() => {
    dispatch.iscsi.getList({});
  }, [dispatch.iscsi]);

  const createISCSI = () => {
    // dispatch.iscsi.createISCSI({
    //   iqn: 'iqn.2019-08.com.linbit:example',
    //   resource_group: 'my-rg',
    //   volumes: [
    //     {
    //       number: 1,
    //       size_kib: 1024,
    //     },
    //   ],
    //   service_ips: ['192.168.122.181/24'],
    // });
    history.push(`/gateway/iscsi/create`);
  };

  console.log(list, 'list...');

  return (
    <PageBasic title={t('iscsi:list')}>
      <Button variant="primary" onClick={createISCSI}>
        Create
      </Button>
      <ComposableTableSortableCustom list={list} />
    </PageBasic>
  );
};

export default List;
