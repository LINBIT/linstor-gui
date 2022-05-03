import React, { useState } from 'react';
import { TableComposable, Thead, Tr, Th, Tbody, Td, ThProps } from '@patternfly/react-table';
import { Button, Label, Modal, ModalVariant } from '@patternfly/react-core';
import styled from 'styled-components';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';

import { NFS } from '@app/interfaces/nfs';
import ActionConfirm from '@app/components/ActionConfirm';
import DynamicForm from '@app/components/DynamicForm';
import { convertRoundUp, sizeOptions } from '@app/utils/size';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';

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
                <Td dataLabel={columnNames.service_ip}>{item.service_ip}</Td>
                <Th dataLabel={columnNames.service_state}>
                  <Label color={isStarted ? 'green' : 'grey'} icon={<InfoCircleIcon />}>
                    {item.status.service}
                  </Label>
                </Th>
                <Th dataLabel={columnNames.nfs_export}>{`/srv/gateway-exports/${item.name}`}</Th>
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
      </TableComposable>
    </React.Fragment>
  );
};
