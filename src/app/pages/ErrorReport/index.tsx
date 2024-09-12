import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { headerCol, ICell } from '@patternfly/react-table';

import FilterList from '@app/components/FilterList';
import PageBasic from '@app/components/PageBasic';
import { ErrorReportType } from '@app/interfaces/errorReports';
import { formatTime } from '@app/utils/time';

const ErrorReportList: React.FunctionComponent = () => {
  const { t } = useTranslation(['error_report', 'common']);
  const [fetchList, setFetchList] = useState(false);
  const history = useHistory();
  const [alertShow, setAlertShow] = useState(false);

  const { run: deleteReport } = useRequest(
    (reportid) => ({
      url: `/v1/error-reports/${reportid}`,
      method: 'delete',
    }),
    {
      manual: true,
      onSuccess: () => {
        setAlertShow(true);
        setFetchList(!fetchList);
      },
    }
  );

  const columns = [
    { title: t('error_report:name'), cellTransforms: [headerCol()] },
    { title: t('error_report:time') },
    { title: t('error_report:message') },
    { title: t('error_report:action') },
  ];

  const cells = (item: unknown) => {
    const errorReport = item as ErrorReportType;
    const name = errorReport?.filename.replace('ErrorReport-', '').replace('.log', '');

    return [name, formatTime(errorReport.error_time), errorReport?.exception_message] as ICell[];
  };

  const listActions = [
    {
      title: t('common:view'),
      onClick: (event, rowId, rowData, extra) => {
        const errorReport = rowData.cells[0];
        history.push(`/error-reports/${errorReport}`);
      },
    },
    {
      title: t('common:delete'),
      onClick: (event, rowId, rowData, extra) => {
        console.log('clicked on Some action, on row: ', rowData);
        const errorReport = rowData.cells[0];
        deleteReport(errorReport);
      },
    },
  ];

  return (
    <PageBasic title={t('list_title')}>
      {alertShow && (
        <Alert
          variant="success"
          title="Success"
          isInline
          isLiveRegion
          actionClose={<AlertActionCloseButton onClose={() => setAlertShow(false)} />}
        />
      )}

      <FilterList
        showSearch={false}
        showFilter={false}
        url="/v1/error-reports"
        actions={listActions}
        fetchList={fetchList}
        columns={columns}
        cells={cells}
        statsUrl="/v1/stats/error-reports"
      />
    </PageBasic>
  );
};

export default ErrorReportList;
