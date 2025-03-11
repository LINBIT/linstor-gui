// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import AddColumnModal from './AddColumnModal';
import { uniqBy } from 'lodash';
import { DeleteOutlined, PlusCircleOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import ResetIcon from './reset.svg';
import SVG from 'react-inlinesvg';
import { useTranslation } from 'react-i18next';

interface CustomColumn {
  title: string;
  dataIndex: string;
  key: string;
  render?: (text: string, record: any) => React.ReactNode;
  isCustom?: boolean;
}

interface WithCustomColumnsProps {
  initialColumns: CustomColumn[];
  dataSource: Record<string, any>[];
  storageKey: string;
}

const ExtraColumnContent = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ColumnAction = styled.div`
  display: flex;
  justify-content: end;
`;

const ResetButton = styled(Button)`
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const withCustomColumns = <P extends object>(
  WrappedComponent: React.ComponentType<P & { columns: CustomColumn[]; dataSource: Record<string, any>[] }>,
) => {
  const WithCustomColumns: React.FC<P & WithCustomColumnsProps> = ({
    initialColumns,
    dataSource: initialDataSource,
    storageKey,
    ...props
  }) => {
    const [columns, setColumns] = useState<CustomColumn[]>(() => {
      const savedColumns = localStorage.getItem(`${storageKey}-columns`);
      if (savedColumns) {
        const parsedColumns = JSON.parse(savedColumns);
        return parsedColumns.map((savedCol: CustomColumn) => {
          const originalCol = initialColumns.find((col) => col.title === savedCol.title);
          return {
            ...originalCol,
            ...savedCol,
            render:
              originalCol?.render || ((text: string, record: any) => record.parent.props[savedCol.dataIndex] || text),
          };
        });
      }
      return initialColumns;
    });

    const { t } = useTranslation('common');

    const [dataSource] = useState(initialDataSource);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const showModal = () => setIsModalVisible(true);

    const handleAddColumn = (newColumn: CustomColumn) => {
      setColumns((prevColumns) => {
        const updatedColumns = [
          ...prevColumns.slice(0, -1),
          {
            ...newColumn,
            isCustom: true,
            render: (text: string, record: any) => record.parent.props[newColumn.dataIndex] || text,
          },
          prevColumns[prevColumns.length - 1],
        ];

        saveColumnsToLocalStorage(updatedColumns);
        return updatedColumns;
      });
      setIsModalVisible(false);
    };

    const handleRemoveColumn = (dataIndex: string) => {
      setColumns((prevColumns) => {
        const updatedColumns = prevColumns.filter((col) => col.dataIndex !== dataIndex);
        saveColumnsToLocalStorage(updatedColumns);
        return updatedColumns;
      });
    };

    const resetColumns = () => {
      setColumns(initialColumns);
      localStorage.removeItem(`${storageKey}-columns`);
    };

    const saveColumnsToLocalStorage = (columnsToSave: CustomColumn[]) => {
      const columnsToPersist = columnsToSave.map(({ title, dataIndex, key, isCustom }) => ({
        title,
        dataIndex,
        key,
        isCustom,
      }));
      localStorage.setItem(`${storageKey}-columns`, JSON.stringify(columnsToPersist));
    };

    const options = uniqBy(
      initialDataSource.flatMap((e) => Object.keys(e.parent.props).map((key) => ({ label: key, value: key }))),
      'label',
    );

    return (
      <div>
        <ColumnAction>
          <Tooltip title={t('add_column')}>
            <Button shape="circle" onClick={showModal} type="primary" icon={<PlusCircleOutlined />} />
          </Tooltip>

          <Tooltip title={t('reset_column')}>
            <ResetButton shape="circle" onClick={resetColumns}>
              <SVG src={ResetIcon} width="16" height="16" />
            </ResetButton>
          </Tooltip>
        </ColumnAction>

        <AddColumnModal
          isVisible={isModalVisible}
          onConfirm={handleAddColumn}
          onCancel={() => setIsModalVisible(false)}
          options={options}
        />
        <WrappedComponent
          {...(props as P)}
          columns={columns.map((col) => ({
            ...col,
            title: col.isCustom ? (
              <ExtraColumnContent>
                {col.title}
                <Button shape="circle" onClick={() => handleRemoveColumn(col.dataIndex)} icon={<DeleteOutlined />} />
              </ExtraColumnContent>
            ) : (
              col.title
            ),
          }))}
          dataSource={dataSource}
        />
      </div>
    );
  };

  return WithCustomColumns;
};

export default withCustomColumns;
