import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@patternfly/react-core';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import List from './List';

const SnapShot: React.FunctionComponent = () => {
  const { t } = useTranslation(['snapshot', 'common']);
  const dispatch = useDispatch<Dispatch>();

  const { list, pageInfo } = useSelector((state: RootState) => ({
    list: state.snapshot.list,
    pageInfo: state.snapshot.pageInfo,
  }));

  // prepare pagination
  const paginationInfo = useMemo(() => {
    return {
      total: pageInfo.total,
      page: pageInfo.currentPage,
      perPage: pageInfo.pageSize,
      onSetPage: function (page: number): void {
        dispatch.report.setPageInfo({
          ...pageInfo,
          currentPage: page,
        });
      },
      onSetPerPage: function (perPage: number): void {
        dispatch.report.setPageInfo({
          ...pageInfo,
          pageSize: perPage,
        });
      },
    };
  }, [dispatch.report, pageInfo]);

  useEffect(() => {
    dispatch.snapshot.getList({});
  }, [dispatch.snapshot]);

  return (
    <PageBasic title={t('snapshot:list')}>
      <Button variant="primary" onClick={() => {}}>
        Create
      </Button>
      <List list={list} pagination={paginationInfo} />
    </PageBasic>
  );
};

export default SnapShot;
