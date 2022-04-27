import React from 'react';
import { TableComposable, Thead, Tr, Th, Tbody, Td, ThProps } from '@patternfly/react-table';
import { Button, Label } from '@patternfly/react-core';
import styled from 'styled-components';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';

import { ISCSI } from '@app/interfaces/iscsi';

interface Data {
  list: ISCSI[];
  handleDelete: (iqn: string) => void;
  handleStart: (iqn: string) => void;
}

const Wrapper = styled.div`
  padding: 2em 0;
  display: flex;

  button:not(:last-child) {
    margin-right: 1em;
  }
`;

export const ISCSIList: React.FC<Data> = ({ list, handleDelete, handleStart }) => {
  const columnNames = {
    iqn: 'IQN',
    service_ip: 'Service IP',
    serice_state: 'Service state',
    linstor_state: 'LINSTOR state',
  };

  return (
    <React.Fragment>
      <TableComposable aria-label="Sortable table custom toolbar">
        <Thead>
          <Tr>
            <Th>{columnNames.iqn}</Th>
            <Th>{columnNames.service_ip}</Th>
            <Th>{columnNames.serice_state}</Th>
            <Th>{columnNames.linstor_state}</Th>
            <Td></Td>
          </Tr>
        </Thead>
        <Tbody>
          {list.map((item, rowIndex) => (
            <Tr key={rowIndex} onRowClick={(e) => console.log(e, item)}>
              <Td dataLabel={columnNames.iqn}>{item.iqn}</Td>
              <Td dataLabel={columnNames.service_ip}>{item.service_ips.join(',')}</Td>
              <Th dataLabel={columnNames.serice_state}>
                <Label color="blue" icon={<InfoCircleIcon />}>
                  {item.status.service}
                </Label>
              </Th>
              <Th dataLabel={columnNames.linstor_state}>
                <Label color="green" icon={<InfoCircleIcon />}>
                  {item.status.state}
                </Label>
              </Th>
              <Td isActionCell>
                <Wrapper>
                  <Button variant="primary" onClick={() => handleStart(item.iqn)}>
                    Start
                  </Button>
                  <Button variant="danger" isDisabled={item.deleting} onClick={() => handleDelete(item.iqn)}>
                    {item.deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </Wrapper>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
    </React.Fragment>
  );
};
