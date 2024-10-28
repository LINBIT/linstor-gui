// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button } from 'antd';
import AddColumnModal from './AddColumnModal';

interface CustomColumn {
  title: string;
  dataIndex: string;
  key: string;
  render?: (text: string) => React.ReactNode;
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
    // Initialize columns from localStorage if available
    const [columns, setColumns] = useState<CustomColumn[]>(() => {
      const savedColumns = localStorage.getItem(`${storageKey}-columns`);
      if (savedColumns) {
        const parsedColumns = JSON.parse(savedColumns);
        return parsedColumns.map((savedCol: CustomColumn) => {
          const originalCol = initialColumns.find((col) => col.title === savedCol.title);
          return originalCol ? { ...originalCol, ...savedCol } : savedCol;
        });
      }
      return initialColumns;
    });

    const [dataSource, setDataSource] = useState<Record<string, any>[]>(initialDataSource);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const showModal = () => setIsModalVisible(true);

    const handleAddColumn = (newColumn: CustomColumn) => {
      setColumns((prevColumns) => {
        // Insert the new column before the last column
        const updatedColumns = [
          ...prevColumns.slice(0, -1), // All columns except the last
          { ...newColumn, render: newColumn.render || ((text) => text) },
          prevColumns[prevColumns.length - 1], // Add the last column back
        ];

        // Update localStorage outside render lifecycle
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
      setDataSource(initialDataSource);
      localStorage.removeItem(`${storageKey}-columns`);
    };

    return (
      <div>
        <Button onClick={showModal}>Add Column</Button>
        <Button onClick={resetColumns} style={{ marginLeft: 8 }}>
          Reset Columns
        </Button>
        <AddColumnModal
          isVisible={isModalVisible}
          onConfirm={handleAddColumn}
          onCancel={() => setIsModalVisible(false)}
        />
        <WrappedComponent {...(props as P)} columns={columns} dataSource={dataSource} />
      </div>
    );
  };

  return WithCustomColumns;
};

export default withCustomColumns;
