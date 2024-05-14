import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  SearchInput,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ThProps,
  IAction,
  TableText,
  ActionsColumn,
} from '@patternfly/react-table';
import { CheckCircleIcon, ExclamationCircleIcon, SearchIcon } from '@patternfly/react-icons';

import { StatusLabel } from '@app/components/StatusLabel';
import { capitalize } from '@app/utils/stringUtils';
import { NodeType } from '@app/interfaces/node';
import PropertyForm from '@app/components/PropertyForm';
import { omit } from '@app/utils/object';
import { Dispatch } from '@app/store';
import { useDispatch } from 'react-redux';
import { ListAction } from './ListAction';
import { Modal } from 'antd';

type NodeListProps = {
  nodes: NodeType[];
};

const List: React.FC<NodeListProps> = ({ nodes = [] }) => {
  const { t } = useTranslation(['node', 'common']);
  const history = useHistory();
  const dispatch = useDispatch<Dispatch>();

  const [activeSortIndex, setActiveSortIndex] = useState<number>();
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc'>();
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const [searchValue, setSearchValue] = useState<string>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNode, setCurrentNode] = useState('');

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
  const areAllSelected = selectedNodes.length > 0 && nodes.length === selectedNodes.length;
  const isSelected = (node: NodeType) => selectedNodes.includes(node.name);

  const setSelected = (node: NodeType, isSelecting = true) =>
    setSelectedNodes((prevSelected) => {
      const otherSelectedRepoNames = prevSelected.filter((r) => r !== node.name);
      return isSelecting ? [...otherSelectedRepoNames, node.name] : otherSelectedRepoNames;
    });

  const lastRowActions = (node: NodeType): IAction[] => [
    {
      title: <div>{t('common:property')}</div>,
      onClick: () => {
        setPropertyModalOpen(true);
        const currentData = omit(node.props ?? {}, 'CurStltConnName');
        setInitialProps({
          ...currentData,
          name: node.name,
        });
      },
    },
    {
      title: <div>{t('common:edit')}</div>,
      onClick: () => {
        history.push(`/inventory/nodes/edit/${node.name}`);
      },
    },

    {
      title: <div>{t('common:delete')}</div>,
      onClick: () => {
        setIsModalOpen(true);
        setCurrentNode(node.name);
      },
    },
    {
      title: <div>{t('common:lost')}</div>,
      onClick: () => dispatch.node.lostNode([node.name]),
    },
  ];

  const handleBatchDelete = () => {
    dispatch.node.deleteNode(selectedNodes);
    setSelectedNodes([]);
  };

  const handleBatchDLost = () => {
    dispatch.node.lostNode(selectedNodes);
    setSelectedNodes([]);
  };

  return (
    <>
      <Toolbar id="toolbar-items">
        <ToolbarContent>
          <ToolbarItem variant="search-filter">
            <SearchInput
              onChange={setSearchValue}
              aria-label="search input example"
              value={searchValue}
              onClear={() => setSearchValue('')}
              placeholder={t('common:search')}
            />
          </ToolbarItem>
          <ToolbarItem>
            <Button
              variant="primary"
              onClick={() => {
                if (searchValue) {
                  dispatch.node.getNodeList({ page: 1, pageSize: 10, nodes: [searchValue] });
                } else {
                  dispatch.node.getNodeList({ page: 1, pageSize: 10 });
                }
              }}
            >
              {t('common:search')}
            </Button>
          </ToolbarItem>
          <ToolbarItem variant="separator" />
          <ToolbarItem>
            <Button variant="primary" onClick={() => history.push('/inventory/nodes/create')}>
              {t('common:add')}
            </Button>
          </ToolbarItem>
          {selectedNodes.length > 0 && (
            <>
              <ToolbarItem>
                <ListAction
                  action={t('common:delete')}
                  message="Are you sure to delete selected nodes?"
                  onConfirm={handleBatchDelete}
                />
              </ToolbarItem>
              <ToolbarItem>
                <ListAction
                  action={t('common:lost')}
                  message="Are you sure to lost selected nodes?"
                  onConfirm={handleBatchDLost}
                />
              </ToolbarItem>
            </>
          )}
        </ToolbarContent>
      </Toolbar>

      <Table aria-label="Node list table" isStriped>
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
            {<Th>{columnNames.default_port}</Th>}
            {<Th>{columnNames.node_type}</Th>}
            <Th>{columnNames.node_status}</Th>
            <Td></Td>
          </Tr>
        </Thead>
        <Tbody>
          {sortedNodes.length === 0 ? (
            <Tr>
              <Td colSpan={8}>
                <Bullseye>
                  <EmptyState variant={EmptyStateVariant.small}>
                    <EmptyStateIcon icon={SearchIcon} />
                    <Title headingLevel="h2" size="lg">
                      No results found
                    </Title>
                    <EmptyStateBody>Clear all filters and try again.</EmptyStateBody>
                    <Button
                      variant="link"
                      onClick={() => {
                        setSearchValue('');
                        dispatch.node.getNodeList({ page: 1, pageSize: 10 });
                      }}
                    >
                      Clear all filters
                    </Button>
                  </EmptyState>
                </Bullseye>
              </Td>
            </Tr>
          ) : (
            sortedNodes.map((node, rowIndex) => {
              const net_interface = node.net_interfaces?.find((e) => e.is_active);
              const rowActions: IAction[] | null = lastRowActions(node);
              const singleActionButton = (
                <TableText>
                  <Button variant="primary" onClick={() => goToDetailPage(node)}>
                    {t('common:view')}
                  </Button>
                </TableText>
              );

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
                  <Td dataLabel={columnNames.default_port}>{net_interface?.satellite_port}</Td>

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
                  <Td modifier="fitContent">{singleActionButton}</Td>
                  <Td isActionCell>
                    <ActionsColumn items={rowActions} actionsToggle={undefined} />
                  </Td>
                </Tr>
              );
            })
          )}
        </Tbody>
      </Table>

      <PropertyForm
        initialVal={initialProps}
        openStatus={propertyModalOpen}
        type="node"
        handleSubmit={(data) => {
          dispatch.node.updateNode({ node: (initialProps?.name || '') as string, data: data as any });
        }}
        handleClose={() => {
          setPropertyModalOpen(false);
        }}
      />

      <Modal
        title="Delete"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => {
          if (currentNode) {
            dispatch.node.deleteNode([currentNode]);
            setIsModalOpen(false);
          }
        }}
      >
        {currentNode && (
          <p>
            Are you sure you want to delete {currentNode} from the LINSTOR cluster? Doing so will remove all LINSTOR
            objects related to this node. The backing storage for any LINSTOR storage-pools on {currentNode} will not be
            altered, and must be cleaned up manually.
          </p>
        )}
      </Modal>
    </>
  );
};

export default List;
