import React, { useState } from 'react';
import { TableComposable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { Pagination } from '@patternfly/react-core';
import { formatBytes } from '@app/utils/size';
import { SnapshotList } from '@app/interfaces/snapShot';
import { formatTime } from '@app/utils/time';

interface Data {
  list: SnapshotList;
  pagination: {
    total: number;
    page: number;
    perPage: number;
    onSetPage: (page: number) => void;
    onSetPerPage: (perPage: number) => void;
  };
}

const List: React.FC<Data> = ({ pagination, list }) => {
  const [perPage, setPerPage] = useState(pagination ? pagination.perPage : 10);
  const [page, setPage] = useState(pagination ? pagination.page : 1);

  const columnNames = {
    resourceName: 'Resource Name',
    snapshotName: 'Snapshot Name',
    nodeNames: 'Node Names',
    volumes: 'Volumes',
    created: 'Created',
    state: 'State',
  };

  const { onSetPage, onSetPerPage, total } = pagination;

  return (
    <React.Fragment>
      <TableComposable aria-label="Sortable table custom toolbar" isExpandable>
        <Thead>
          <Tr>
            <Th>{columnNames.resourceName}</Th>
            <Th>{columnNames.snapshotName}</Th>
            <Th>{columnNames.nodeNames}</Th>
            <Th>{columnNames.volumes}</Th>
            <Th>{columnNames.created}</Th>
            <Th>{columnNames.state}</Th>
          </Tr>
        </Thead>

        <Tbody>
          {list.map((snapshot) => (
            <Tr key={snapshot.uuid}>
              <Td dataLabel={columnNames.resourceName}>{snapshot.resource_name}</Td>
              <Td dataLabel={columnNames.snapshotName}>{snapshot.name}</Td>
              <Td dataLabel={columnNames.resourceName}>{snapshot.nodes.join(', ')}</Td>
              <Td dataLabel={columnNames.resourceName}>
                {snapshot.volume_definitions
                  .map((e) => {
                    return `${e.volume_number}: ${formatBytes(e.size_kib)}`;
                  })
                  .join(', ')}
              </Td>
              <Td dataLabel={columnNames.created}>{formatTime(snapshot.snapshots[0].create_timestamp)}</Td>
              <Td dataLabel={columnNames.snapshotName}>
                {snapshot.flags.includes('SUCCESSFUL') ? 'Successful' : 'Failed'}
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
    </React.Fragment>
  );
};

export default List;
