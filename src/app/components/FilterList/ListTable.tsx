import React, { useState, useEffect } from 'react';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { Table, TableHeader, TableBody, IRow, ICell } from '@patternfly/react-table';
import { TNodeListType } from '@app/interfaces/node';
import { SearchIcon } from '@patternfly/react-icons';

import './ListTable.css';

interface Props {
  listData: TNodeListType;
  loading: boolean;
  error: boolean | Error;
  columns: Array<ICell>;
  cells: (item: any) => Array<IRow>;
  actions?: Array<any>;
  onClear?: () => void;
  handleSelectChange?: (rows: IRow[]) => void;
  noSelect?: boolean
}

const ListTable: React.FC<Props> = ({
  columns,
  listData,
  loading,
  error,
  actions,
  cells,
  onClear,
  handleSelectChange,
  noSelect
}) => {
  const [rows, setRows] = useState<IRow[]>([]);

  useEffect(() => {
    let newRows: IRow[] = [];
    if (loading) {
      newRows = [
        {
          heightAuto: true,
          showSelect: false,
          cells: [
            {
              props: { colSpan: 8 },
              title: (
                <Bullseye>
                  <Spinner size="xl" />
                </Bullseye>
              ),
            },
          ],
        },
      ];
    } else if (error) {
      newRows = [
        {
          heightAuto: true,
          cells: [
            {
              props: { colSpan: 8 },
              title: (
                <EmptyState variant={EmptyStateVariant.small}>
                  <Title headingLevel="h2" size="lg" key="empty_title">
                    Unable to connect
                  </Title>
                  <EmptyStateBody key="empty_body">
                    There was an error retrieving data. Check your connection and try again.
                  </EmptyStateBody>
                </EmptyState>
              ),
            },
          ],
        },
      ];
    } else if (!listData.length) {
      newRows = [
        {
          heightAuto: true,
          showSelect: false,
          cells: [
            {
              props: { colSpan: 8 },
              title: (
                <Bullseye>
                  <EmptyState variant={EmptyStateVariant.small}>
                    <EmptyStateIcon icon={SearchIcon} key="empty_icon" />
                    <Title headingLevel="h2" size="lg" key="empty_title">
                      No results found
                    </Title>
                    <EmptyStateBody key="empty_body">
                      No results match the filter criteria. Remove all filters or clear all filters to show results.
                    </EmptyStateBody>
                    <Button variant="link" key="empty_btn" onClick={onClear}>
                      Clear all filters
                    </Button>
                  </EmptyState>
                </Bullseye>
              ),
            },
          ],
        },
      ];
    } else {
      newRows = listData.map((item) => {
        return {
          cells: cells(item),
        };
      });
    }

    setRows(newRows);
  }, [listData, setRows, loading, error, cells, onClear]);

  const onSelect = (event, isSelected, rowId) => {
    let newRows: IRow[];
    if (rowId === -1) {
      newRows = rows.map((oneRow) => {
        oneRow.selected = isSelected;
        return oneRow;
      });
    } else {
      newRows = [...rows];
      newRows[rowId].selected = isSelected;
    }
    setRows(newRows);
    handleSelectChange && handleSelectChange(newRows);
  };



  const extra =
    loading || !listData.length
      ? {}
      : {
          onSelect: noSelect ? undefined : onSelect,
          actions,
          canSelectAll: true,
        };

  return (
    <>
      <Table aria-label="Table List" className="my__table" cells={columns} rows={rows} {...extra}>
        <TableHeader className="table__header" />
        <TableBody className="table__body" />
      </Table>
    </>
  );
};

export default ListTable;
