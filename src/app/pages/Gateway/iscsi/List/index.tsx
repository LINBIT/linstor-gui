import React from 'react';
import { TableComposable, Thead, Tr, Th, Tbody, Td, ThProps } from '@patternfly/react-table';
import { Label } from '@patternfly/react-core';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';

import { ISCSI } from '@app/interfaces/iscsi';

interface Data {
  list: ISCSI[];
}

export const ComposableTableSortableCustom: React.FunctionComponent<Data> = ({ list }) => {
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
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
    </React.Fragment>
  );
};
