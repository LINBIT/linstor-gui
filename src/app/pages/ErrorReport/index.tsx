import React, { useCallback, useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { Dispatch, RootState } from '@app/store';
import { SimpleList } from './components/List';

const ErrorReportList: React.FunctionComponent = () => {
  const { t } = useTranslation(['error_report', 'common']);
  const history = useHistory();
  const dispatch = useDispatch<Dispatch>();

  // read error report list from store
  const { list, pageInfo } = useSelector((state: RootState) => ({
    list: state.report.list,
    pageInfo: state.report.pageInfo,
  }));

  // get list
  useEffect(() => {
    dispatch.report.getReportList({ page: 1, pageSize: 10 });
  }, [dispatch]);

  // handle click on delete button
  const handleDelete = useCallback(
    (id: string) => {
      dispatch.report.deleteReport({
        ids: [id],
      });
    },
    [dispatch.report]
  );

  // handle click on view button
  const handleView = useCallback(
    (id) => {
      history.push(`/error-reports/${id}`);
    },
    [history]
  );

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

  return (
    <PageBasic title={t('list_title')}>
      <SimpleList pagination={paginationInfo} dataList={list} onDelete={handleDelete} onView={handleView} />
    </PageBasic>
  );
};

export default ErrorReportList;
