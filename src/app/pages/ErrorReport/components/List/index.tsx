import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Modal,
  ModalVariant,
  OverflowMenu,
  OverflowMenuContent,
  OverflowMenuGroup,
  OverflowMenuItem,
  Pagination,
  Title,
} from '@patternfly/react-core';
import { TableComposable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';

import { formatTime } from '@app/utils/time';
import { useTranslation } from 'react-i18next';
import { ErrorReportList, ReportType } from '@app/interfaces/report';
import { useDispatch } from 'react-redux';
import { Dispatch } from '@app/store';

import styled from '@emotion/styled';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';

interface Prop {
  pagination: {
    total: number;
    page: number;
    perPage: number;
    onSetPage: (page: number) => void;
    onSetPerPage: (perPage: number) => void;
  };
  dataList: ErrorReportList;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const Toolbar = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

export const SimpleList: React.FunctionComponent<Prop> = ({ pagination, dataList, onDelete, onView }) => {
  const [perPage, setPerPage] = useState(pagination ? pagination.perPage : 10);
  const [page, setPage] = useState(pagination ? pagination.page : 1);
  const [selected, setSelected] = useState<string[]>([]);
  const { t } = useTranslation(['error_report', 'common']);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const { onSetPage, onSetPerPage, total } = pagination;

  const dispatch = useDispatch<Dispatch>();

  const columnNames = {
    id: t('error_report:name'),
    time: t('error_report:time'),
    message: t('error_report:message'),
    action: t('error_report:action'),
  };

  const getId = useCallback((report) => {
    return report.filename.replace('ErrorReport-', '').replace('.log', '');
  }, []);

  const listShow = useMemo(
    () =>
      dataList.slice((page - 1) * perPage, page * perPage).map((report) => ({
        id: getId(report),
        ...report,
      })),
    [dataList, page, perPage, getId]
  );

  const selectAll = (isSelecting = true) => setSelected(isSelecting ? listShow.map((r) => r.id) : []);
  const areAllSelected = selected.length > 0 && listShow.length === selected.length;
  const isSelected = (
    report: ReportType & {
      id: string;
    }
  ) => selected.includes(report.id);

  const handleSelect = (report, isSelecting = true) =>
    setSelected((prevSelected) => {
      const otherSelected = prevSelected.filter((r) => r !== report.id);
      return isSelecting ? [...otherSelected, report.id] : otherSelected;
    });

  const handleDelete = useCallback(
    (deleteAll?: boolean) => {
      if (deleteAll) {
        dispatch.report.deleteReport({ deleteAll });
        handleModalToggle();
      } else {
        dispatch.report.deleteReport({
          ids: selected,
        });
      }

      setSelected([]);
    },
    [dispatch.report, handleModalToggle, selected]
  );

  const isNotEmpty = listShow.length > 0;

  return (
    <>
      <Toolbar>
        <Button variant="danger" isDisabled={selected.length === 0} onClick={() => handleDelete()}>
          Delete
        </Button>
        <Button variant="danger" style={{ marginLeft: '1rem' }} onClick={handleModalToggle}>
          Delete All
        </Button>
        <Modal
          variant={ModalVariant.small}
          title="Caution!"
          isOpen={isModalOpen}
          onClose={handleModalToggle}
          actions={[
            <Button
              key="confirm"
              variant="primary"
              onClick={() => {
                handleDelete(true);
              }}
            >
              Confirm
            </Button>,
            <Button key="cancel" variant="link" onClick={handleModalToggle}>
              Cancel
            </Button>,
          ]}
        >
          Are you sure you want to delete all reports? <br />
          This action cannot be undone.
        </Modal>
      </Toolbar>
      <TableComposable aria-label="Simple table" isStriped>
        <Thead>
          <Tr>
            <Th
              select={{
                onSelect: (_event, isSelecting) => selectAll(isSelecting),
                isSelected: areAllSelected,
              }}
            />
            <Th>{columnNames.id}</Th>
            <Th>{columnNames.time}</Th>
            <Th>{columnNames.message}</Th>
            <Th>{columnNames.action}</Th>
          </Tr>
        </Thead>
        {isNotEmpty ? (
          <Tbody>
            {listShow.map((report, rowIndex) => (
              <Tr key={report.id}>
                <Td
                  select={{
                    rowIndex,
                    onSelect: (_event, isSelecting) => handleSelect(report, isSelecting),
                    isSelected: isSelected(report),
                  }}
                />
                <Td dataLabel={columnNames.id}>{report.id}</Td>
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
        ) : (
          <Tbody>
            <Tr>
              <Td colSpan={8}>
                <Bullseye>
                  <EmptyState variant={EmptyStateVariant.small}>
                    <EmptyStateIcon icon={SearchIcon} />
                    <Title headingLevel="h2" size="lg">
                      No results found
                    </Title>
                    <EmptyStateBody>Please try again later.</EmptyStateBody>
                  </EmptyState>
                </Bullseye>
              </Td>
            </Tr>
          </Tbody>
        )}
      </TableComposable>
      {isNotEmpty && (
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
      )}
    </>
  );
};
