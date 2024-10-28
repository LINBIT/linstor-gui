// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button } from 'antd';
import AddColumnModal from './AddColumnModal';
import uniqBy from 'lodash.uniqby';

interface CustomColumn {
  title: string;
  dataIndex: string;
  key: string;
  render?: (text: string, record: any) => React.ReactNode;
}

interface WithCustomColumnsProps {
  initialColumns: CustomColumn[];
  dataSource: Record<string, any>[];
  storageKey: string;
}

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

    const [dataSource] = useState(initialDataSource);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const showModal = () => setIsModalVisible(true);

    const handleAddColumn = (newColumn: CustomColumn) => {
      setColumns((prevColumns) => {
        const updatedColumns = [
          ...prevColumns.slice(0, -1),
          {
            ...newColumn,
            render: (text: string, record: any) => record.parent.props[newColumn.dataIndex] || text,
          },
          prevColumns[prevColumns.length - 1],
        ];

        setTimeout(() => {
          const columnsToSave = updatedColumns.map(({ title, dataIndex, key }) => ({
            title,
            dataIndex,
            key,
          }));
          localStorage.setItem(`${storageKey}-columns`, JSON.stringify(columnsToSave));
        }, 0);

        return updatedColumns;
      });
      setIsModalVisible(false);
    };

    const resetColumns = () => {
      setColumns(initialColumns);
      localStorage.removeItem(`${storageKey}-columns`);
    };

    const options = uniqBy(
      initialDataSource.flatMap((e) => Object.keys(e.parent.props).map((key) => ({ label: key, value: key }))),
      'label',
    );

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button onClick={showModal} type="primary">
            Add Column
          </Button>
          <Button onClick={resetColumns} style={{ marginLeft: 8 }}>
            Reset Columns
          </Button>
        </div>

        <AddColumnModal
          isVisible={isModalVisible}
          onConfirm={handleAddColumn}
          onCancel={() => setIsModalVisible(false)}
          options={options}
        />
        <WrappedComponent {...(props as P)} columns={columns} dataSource={dataSource} />
      </div>
    );
  };

  return WithCustomColumns;
};

export default withCustomColumns;
