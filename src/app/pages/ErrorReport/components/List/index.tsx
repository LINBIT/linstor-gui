import React, { useCallback, useMemo, useState } from 'react';
import {
  Button,
  OverflowMenu,
  OverflowMenuContent,
  OverflowMenuGroup,
  OverflowMenuItem,
  Pagination,
} from '@patternfly/react-core';
import { TableComposable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { formatTime } from '@app/utils/time';
import { useTranslation } from 'react-i18next';

import { ListPagination } from '@app/components/ListPagination';

interface Prop {
  pagination: {
    total: number;
    page: number;
    perPage: number;
    onSetPage: (page: number) => void;
    onSetPerPage: (perPage: number) => void;
  };
  dataList: Array<any>;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export const SimpleList: React.FunctionComponent<Prop> = ({ pagination, dataList, onDelete, onView }) => {
  const [perPage, setPerPage] = useState(pagination ? pagination.perPage : 10);
  const [page, setPage] = useState(pagination ? pagination.page : 1);
  const { t } = useTranslation(['error_report', 'common']);

  const { onSetPage, onSetPerPage, total } = pagination;

  const columnNames = {
    id: t('error_report:name'),
    time: t('error_report:time'),
    message: t('error_report:message'),
    action: t('error_report:action'),
  };

  const listShow = useMemo(() => dataList.slice((page - 1) * perPage, page * perPage), [dataList, page, perPage]);

  const getId = useCallback((report) => {
    return report.filename.replace('ErrorReport-', '').replace('.log', '');
  }, []);

  return (
    <>
      <TableComposable aria-label="Simple table" isStriped>
        <Thead>
          <Tr>
            <Th>{columnNames.id}</Th>
            <Th>{columnNames.time}</Th>
            <Th>{columnNames.message}</Th>
            <Th>{columnNames.action}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {listShow.map((report) => (
            <Tr key={report.name}>
              <Td dataLabel={columnNames.id}>{report.filename.replace('ErrorReport-', '').replace('.log', '')}</Td>
              <Td dataLabel={columnNames.time}>{formatTime(report.error_time)}</Td>
              <Td dataLabel={columnNames.message}>{report.exception_message}</Td>
              <Td isActionCell>
                <OverflowMenu breakpoint="lg">
                  <OverflowMenuContent>
                    <OverflowMenuGroup groupType="button">
                      <OverflowMenuItem>
                        <Button variant="primary" onClick={() => onView(getId(report))}>
                          {t('common:view')}
                        </Button>
                      </OverflowMenuItem>
                      <OverflowMenuItem>
                        <Button variant="danger" onClick={() => onDelete(getId(report))}>
                          {t('common:delete')}
                        </Button>
                      </OverflowMenuItem>
                    </OverflowMenuGroup>
                  </OverflowMenuContent>
                </OverflowMenu>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
      <Pagination
        itemCount={total}
        perPage={perPage}
        page={page}
        onSetPage={(e, newPage) => {
          setPage(newPage);
          onSetPage(newPage);
        }}
        widgetId="pagination-options-menu-top"
        onPerPageSelect={(e, newPerPage, newPage) => {
          setPage(newPage);
          onSetPage(newPage);
          setPerPage(newPerPage);
          onSetPerPage(newPerPage);
        }}
      />
    </>
  );
};
