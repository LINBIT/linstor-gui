import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { TableComposable, Thead, Tr, Th, Tbody, Td, ThProps } from '@patternfly/react-table';
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';

import { StatusLabel } from '@app/components/StatusLabel';
import { capitalize } from '@app/utils/stringUtils';
import { NodeType } from '@app/interfaces/node';
import {
  Button,
  Dropdown,
  KebabToggle,
  OverflowMenu,
  OverflowMenuContent,
  OverflowMenuControl,
  OverflowMenuGroup,
  OverflowMenuItem,
} from '@patternfly/react-core';

type NodeListProps = {
  nodes: NodeType[];
};

const List: React.FC<NodeListProps> = ({ nodes = [] }) => {
  const { t } = useTranslation(['node', 'common']);
  const history = useHistory();

  const [activeSortIndex, setActiveSortIndex] = React.useState<number>();
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc'>();
  const [selectedNodes, setSelectedNodes] = React.useState<string[]>([]);

  const columnNames = {
    name: t('node_name'),
    default_ip: t('default_ip'),
    default_port: t('default_port'),
    node_type: t('node_type'),
    node_status: t('node_status'),
  };

  const getSortableRowValues = (node: NodeType): (string | number)[] => {
    const { name, net_interfaces } = node;
    const net_interface = net_interfaces?.find((e) => e.is_active);
    if (!net_interface) {
      return [name];
    }
    return [name, net_interface.address];
  };

  let sortedNodes = nodes;
  if (activeSortIndex !== undefined) {
    sortedNodes = nodes.sort((a, b) => {
      const aValue = getSortableRowValues(a)[activeSortIndex];
      const bValue = getSortableRowValues(b)[activeSortIndex];

      if (activeSortIndex === 1) {
        // sort IP address
        const num1 = Number(
          aValue
            .toString()
            .split('.')
            .map((num) => `000${num}`.slice(-3))
            .join('')
        );
        const num2 = Number(
          bValue
            .toString()
            .split('.')
            .map((num) => `000${num}`.slice(-3))
            .join('')
        );
        if (activeSortDirection === 'asc') {
          return num1 - num2;
        }
        return num2 - num1;
      }

      if (typeof aValue === 'number') {
        // Numeric sort
        if (activeSortDirection === 'asc') {
          return (aValue as number) - (bValue as number);
        }
        return (bValue as number) - (aValue as number);
      } else {
        // String sort
        if (activeSortDirection === 'asc') {
          return (aValue as string).localeCompare(bValue as string);
        }
        return (bValue as string).localeCompare(aValue as string);
      }
    });
  }

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex,
  });

  const goToDetailPage = (node: NodeType) => {
    history.push(`/inventory/nodes/${node.name}`);
  };

  const selectAll = (isSelecting = true) => setSelectedNodes(isSelecting ? nodes.map((r) => r.name) : []);
  const areAllSelected = nodes.length === selectedNodes.length;
  const isSelected = (node: NodeType) => selectedNodes.includes(node.name);

  const setSelected = (node: NodeType, isSelecting = true) =>
    setSelectedNodes((prevSelected) => {
      const otherSelectedRepoNames = prevSelected.filter((r) => r !== node.name);
      return isSelecting ? [...otherSelectedRepoNames, node.name] : otherSelectedRepoNames;
    });

  useEffect(() => {
    console.log(selectedNodes, 'selectedNodes');
  }, [selectedNodes]);

  return (
    <>
      <TableComposable aria-label="Node list table" isStriped>
        <Thead>
          <Tr>
            <Th
              select={{
                onSelect: (_event, isSelecting) => selectAll(isSelecting),
                isSelected: areAllSelected,
              }}
            />
            <Th sort={getSortParams(0)}>{columnNames.name}</Th>
            <Th sort={getSortParams(1)}>{columnNames.default_ip}</Th>
            <Th>{columnNames.default_port}</Th>
            <Th>{columnNames.node_type}</Th>
            <Th>{columnNames.node_status}</Th>
            <Td></Td>
          </Tr>
        </Thead>
        <Tbody>
          {sortedNodes.map((node, rowIndex) => {
            const net_interface = node.net_interfaces?.find((e) => e.is_active);

            return (
              <Tr key={node.name} isHoverable>
                <Td
                  select={{
                    rowIndex,
                    onSelect: (_event, isSelecting) => {
                      setSelected(node, isSelecting);
                    },
                    isSelected: isSelected(node),
                  }}
                />
                <Td dataLabel={columnNames.name}>{node.name}</Td>
                <Td dataLabel={columnNames.default_ip}>{net_interface?.address}</Td>
                <Td dataLabel={columnNames.default_ip}>{net_interface?.satellite_port}</Td>
                <Td dataLabel={columnNames.node_type}>
                  <StatusLabel status={'info'} label={capitalize(node?.type)} />
                </Td>
                <Td dataLabel={columnNames.node_status}>
                  {node.connection_status === 'ONLINE' ? (
                    <CheckCircleIcon size="sm" color="green" />
                  ) : (
                    <ExclamationCircleIcon size="sm" color="red" />
                  )}
                  <span> {capitalize(node?.connection_status)}</span>
                </Td>
                <Td isActionCell>
                  <OverflowMenu breakpoint="lg">
                    <OverflowMenuContent>
                      <OverflowMenuGroup groupType="button">
                        <OverflowMenuItem>
                          <Button variant="primary">View</Button>
                        </OverflowMenuItem>
                        <OverflowMenuItem>
                          <Button variant="secondary">Edit</Button>
                        </OverflowMenuItem>
                        <OverflowMenuItem>
                          <Button variant="warning">Delete</Button>
                        </OverflowMenuItem>
                        <OverflowMenuItem>
                          <Button variant="danger">Lost</Button>
                        </OverflowMenuItem>
                      </OverflowMenuGroup>
                    </OverflowMenuContent>
                  </OverflowMenu>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </TableComposable>
    </>
  );
};

export default List;
