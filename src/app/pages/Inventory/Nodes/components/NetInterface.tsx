import React from 'react';
import { DataList, DataListItem, DataListItemCells, DataListItemRow, DataListCell, Icon } from '@patternfly/react-core';
import { NetInterfaceType } from '@app/interfaces/net_interface';
import { CheckCircleIcon, TimesCircleIcon } from '@patternfly/react-icons';
import { Centered } from './styled';

interface Props {
  list: NetInterfaceType[];
}

const NetInterfaceList: React.FC<Props> = ({ list }) => {
  return (
    <DataList aria-label="Checkbox and action data list example">
      {list?.map((e) => (
        <DataListItem key={e.name} aria-labelledby="check-action-item1">
          <DataListItemRow>
            <DataListItemCells
              dataListCells={[
                <DataListCell key="address">
                  <div>Address:</div>
                  <div>{e.address}</div>
                </DataListCell>,
                <DataListCell key="name">
                  <div>Name: </div>
                  <div>{e.name}</div>
                </DataListCell>,
                <DataListCell key="port">
                  <div>Port:</div>
                  <div>{e.satellite_port}</div>
                </DataListCell>,
                <DataListCell key="status">
                  <div>Active: </div>
                  <Centered>
                    {e.is_active ? (
                      <Icon status="success">
                        <CheckCircleIcon />
                      </Icon>
                    ) : (
                      <Icon status="warning">
                        <TimesCircleIcon />
                      </Icon>
                    )}
                  </Centered>
                </DataListCell>,
              ]}
            />
          </DataListItemRow>
        </DataListItem>
      ))}
    </DataList>
  );
};

export default NetInterfaceList;
