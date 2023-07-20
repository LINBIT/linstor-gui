import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@patternfly/react-core';
import { useMutation } from '@tanstack/react-query';

import { Dispatch, RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';

import List from './List';
import { CreateSnapshotForm, CreateSnapshotRequestBody, createSnapshot } from '@app/features/snapshot';

const SnapShot: React.FunctionComponent = () => {
  const { t } = useTranslation(['snapshot', 'common']);
  const dispatch = useDispatch<Dispatch>();

  const [open, setOpen] = useState(false);

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

  const createResourceMutation = useMutation({
    mutationFn: (data: CreateSnapshotRequestBody) => {
      const { resource_name, ...rest } = data;
      return createSnapshot(resource_name || '', rest);
    },
    onSettled: () => {
      setOpen(false);
      dispatch.snapshot.getList({});
    },
  });

  return (
    <PageBasic title={t('snapshot:list')}>
      <Button
        variant="primary"
        onClick={() => {
          setOpen(true);
        }}
      >
        Create
      </Button>
      <List list={list} pagination={paginationInfo} />
      <CreateSnapshotForm
        open={open}
        onCancel={() => {
          setOpen(false);
        }}
        onCreate={(values) => {
          console.log(values, 'values');
          createResourceMutation.mutate(values);
        }}
      />
    </PageBasic>
  );
};

export default SnapShot;
