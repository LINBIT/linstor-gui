import React, { useState } from 'react';
import { TableComposable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Label,
  Title,
} from '@patternfly/react-core';
import styled from '@emotion/styled';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';

import { NFS } from '@app/interfaces/nfs';
import ActionConfirm from '@app/components/ActionConfirm';
import { SearchIcon } from '@patternfly/react-icons';

interface Data {
  list: NFS[];
  handleDelete: (iqn: string) => void;
  handleStart: (iqn: string) => void;
  handleStop: (iqn: string) => void;
}

const Wrapper = styled.div`
  padding: 2em 0;
  display: flex;

  button:not(:last-child) {
    margin-right: 1em;
  }
`;

export const NFSList: React.FC<Data> = ({ list, handleDelete, handleStart, handleStop }) => {
  const [isOpen, setIsOpen] = useState(false);

  const columnNames = {
    resource: 'Resource',
    service_ip: 'Service IP',
    on_node: 'On Node',
    service_state: 'Service State',
    nfs_export: 'NFS export',
    linstor_state: 'LINSTOR State',
  };

  return (
    <React.Fragment>
      <TableComposable aria-label="Sortable table custom toolbar" isExpandable>
        <Thead>
          <Tr>
            <Th>{columnNames.resource}</Th>
            <Th>{columnNames.on_node}</Th>
            <Th>{columnNames.service_ip}</Th>
            <Th>{columnNames.service_state}</Th>
            <Th>{columnNames.nfs_export}</Th>
            <Th>{columnNames.linstor_state}</Th>
            <Td>Action</Td>
          </Tr>
        </Thead>

        {list.map((item, rowIndex) => {
          const isStarted = item.status.service === 'Started';
          return (
            <Tbody key={rowIndex}>
              <Tr>
                <Td dataLabel={columnNames.resource}>{item.name}</Td>
                <Td dataLabel={columnNames.on_node}>{item.status.primary}</Td>
                <Td dataLabel={columnNames.service_ip}>{item.service_ip}</Td>
                <Th dataLabel={columnNames.service_state}>
                  <Label color={isStarted ? 'green' : 'grey'} icon={<InfoCircleIcon />}>
                    {item.status.service}
                  </Label>
                </Th>
                <Th dataLabel={columnNames.nfs_export}>{item.volumes[1].export_path}</Th>
                <Th dataLabel={columnNames.linstor_state}>
                  <Label color={item.status.state === 'OK' ? 'green' : 'red'} icon={<InfoCircleIcon />}>
                    {item.status.state}
                  </Label>
                </Th>
                <Td isActionCell>
                  <Wrapper>
                    <Button
                      isDisabled={item.starting || item.stopping}
                      variant="primary"
                      onClick={() => (isStarted ? handleStop(item.name) : handleStart(item.name))}
                    >
                      {item.starting && 'Starting...'}
                      {item.stopping && 'Stopping...'}
                      {!item.starting && !item.stopping && isStarted && 'Stop'}
                      {!item.starting && !item.stopping && !isStarted && 'Start'}
                    </Button>

                    <Button variant="danger" isDisabled={item.deleting} onClick={() => setIsOpen(true)}>
                      {item.deleting ? 'Deleting...' : 'Delete'}
                    </Button>

                    <ActionConfirm
                      onConfirm={() => {
                        handleDelete(item.name);
                        setIsOpen(false);
                      }}
                      onCancel={() => setIsOpen(false)}
                      isModalOpen={isOpen}
                    />
                  </Wrapper>
                </Td>
              </Tr>
            </Tbody>
          );
        })}

        {list.length === 0 && (
          <Td colSpan={8}>
            <Bullseye>
              <EmptyState variant={EmptyStateVariant.small}>
                <EmptyStateIcon icon={SearchIcon} />
                <Title headingLevel="h2" size="lg">
                  No results found
                </Title>
              </EmptyState>
            </Bullseye>
          </Td>
        )}
      </TableComposable>
    </React.Fragment>
  );
};
