import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { headerCol, ICell } from '@patternfly/react-table';
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';

import PageBasic from '@app/components/PageBasic';

import { useDispatch, useSelector } from 'react-redux';
import { Dispatch, RootState } from '@app/store';
import { StatusLabel } from '@app/components/StatusLabel';
import { capitalize } from '@app/utils/stringUtils';
import { ListPagination } from '@app/components/ListPagination';
import List from './components/List';

const NodeList: React.FunctionComponent = () => {
  const { t } = useTranslation(['node', 'common']);
  const dispatch = useDispatch<Dispatch>();
  // get loading state and alerts from Redux
  const { nodeList, pagination } = useSelector((state: RootState) => ({
    toast: state.notification.toast,
    nodeList: state.node.list,
    pagination: state.node.pageInfo,
  }));

  useEffect(() => {
    dispatch.node.getNodeList({ page: 1, pageSize: 10 });
  }, [dispatch.node]);

  const columns = [
    { title: t('node_name'), cellTransforms: [headerCol()] },
    { title: t('default_ip') },
    { title: t('default_port') },
    { title: t('node_type') },
    { title: t('node_status') },
    { title: '' },
  ];

  const cells = (item) => {
    const net_interface = item.net_interfaces?.find((e) => e.is_active);

    return [
      item?.name,
      net_interface?.address,
      net_interface?.satellite_port,
      {
        title: <StatusLabel status={'info'} label={capitalize(item?.type)} />,
      },
      {
        title: (
          <div>
            {item?.connection_status === 'ONLINE' ? (
              <CheckCircleIcon size="sm" color="green" />
            ) : (
              <ExclamationCircleIcon size="sm" color="red" />
            )}
            <span> {capitalize(item?.connection_status)}</span>
          </div>
        ),
      },
      { ...item?.props },
    ] as ICell[];
  };

  return (
    <PageBasic title={t('node_list')}>
      <List nodes={nodeList} />
      <ListPagination
        {...pagination}
        onSetPage={function (currentPage: number): void {
          dispatch.node.setPageInfo({
            ...pagination,
            currentPage,
          });
        }}
        onSetPerPage={function (pageSize: number): void {
          dispatch.node.setPageInfo({
            ...pagination,
            pageSize,
          });
        }}
      />
    </PageBasic>
  );
};

export default NodeList;
