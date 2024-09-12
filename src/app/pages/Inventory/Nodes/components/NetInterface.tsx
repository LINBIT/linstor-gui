import React, { useState } from 'react';
import {
  DataList,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DataListCell,
  DataListAction,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  KebabToggle,
  Switch,
} from '@patternfly/react-core';
import { NetInterfaceType } from '@app/interfaces/node';

interface ActionsProps {
  item: NetInterfaceType[0]
}

const Actions: React.FC<ActionsProps> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DataListAction
    aria-labelledby="check-action-item1 check-action-action1"
    id="check-action-action1"
    aria-label="Actions"
    isPlainButtonAction
  >
    <Dropdown
      isPlain
      position={DropdownPosition.right}
      isOpen={isOpen}
      onSelect={() => setIsOpen(!isOpen)}
      toggle={<KebabToggle onToggle={() => setIsOpen(!isOpen)} />}
      dropdownItems={[
        <DropdownItem key="link" component="button">
          View
        </DropdownItem>,
        <DropdownItem key="action" component="button" isDisabled={item.is_active}>
          Activate
        </DropdownItem>,
      ]}
    />
  </DataListAction>
  )
}

interface Props {
  list: NetInterfaceType;
}

const NetInterfaceList: React.FC<Props> = ({ list }) => {
  return (
    <DataList aria-label="Checkbox and action data list example">
      {list?.map((e) => (
        <DataListItem key={e.uuid} aria-labelledby="check-action-item1">
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
                  <div>
                    <Switch id="no-label-switch-on" aria-label="Message when on" isChecked={e.is_active} />
                  </div>
                </DataListCell>,
              ]}
            />
            <Actions item={e} />
          </DataListItemRow>
        </DataListItem>
      ))}
    </DataList>
  );
};

export default NetInterfaceList;
