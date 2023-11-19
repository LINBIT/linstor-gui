import React, { useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch, RootState } from '@app/store';
import { ListPagination } from '@app/components/ListPagination';
import List from './components/List';
import { VSANNodeList } from '@app/features/node';

const NodeList: React.FunctionComponent = () => {
  const { t } = useTranslation(['node', 'common']);
  const dispatch = useDispatch<Dispatch>();
  const { nodeList, pagination, vsanMode } = useSelector((state: RootState) => ({
    toast: state.notification.toast,
    nodeList: state.node.list,
    pagination: state.node.pageInfo,
    vsanMode: state.setting.KVS?.vsanMode,
  }));

  useEffect(() => {
    dispatch.node.getNodeList({ page: 1, pageSize: 10 });
  }, [dispatch.node]);

  return (
    <PageBasic title={t('node_list')}>
      {vsanMode ? (
        <VSANNodeList />
      ) : (
        <>
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
        </>
      )}
    </PageBasic>
  );
};

export default NodeList;
