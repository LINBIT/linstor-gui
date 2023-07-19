import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import uniqby from 'lodash.uniqby';

import DynamicForm from '@app/components/DynamicForm';
import { TYPE_MAP, FormItem } from '@app/interfaces/dynamicFormType';

interface Props {
  handleSubmit: (data: { [key: string]: string | number | boolean | Array<string> }) => void;
  initialVal?: { [key: string]: string | number | boolean | Array<string> };
  loading?: boolean;
  editing?: boolean;
}

const ResourceForm: React.FC<Props> = ({ initialVal, handleSubmit, loading, editing }) => {
  const [allocateMethod, setAllocateMethod] = useState('manual');
  const history = useHistory();

  const { data: resourceDefinitionList, loading: resourceDefinitionLoading } = useRequest('/v1/resource-definitions');
  const { data: nodeList, loading: nodeListLoading } = useRequest('/v1/nodes');
  const { data: storagePoolList, loading: storagePoolListLoading } = useRequest('/v1/view/storage-pools');
  const [nodeNetWorksList, setNodeNetWorksList] = useState<SelectOptions>([]);

  const { run: getNodeNetworkLists, loading: nodeNetworkListLoading } = useRequest(
    (node) => ({
      url: `/v1/nodes/${node}/net-interfaces`,
    }),
    {
      manual: true,
      onSuccess: (data) => {
        const nodeNetworkListOption = data.map((e) => ({ value: e.name, label: e.name, isDisabled: false }));
        nodeNetworkListOption.unshift({ value: '', label: 'Select a network', isDisabled: false, isPlaceholder: true });
        setNodeNetWorksList(nodeNetworkListOption);
      },
    }
  );

  const formItems = useMemo(() => {
    return [
      {
        name: 'resource_definition_name',
        type: TYPE_MAP.SINGLE_SELECT,
        label: 'Resource Definition Name',
        defaultValue: initialVal?.resource_definition_name,
        isDisabled: editing,
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Resource definition is required',
        },
        extraInfo: {
          options: resourceDefinitionLoading
            ? []
            : [{ value: '', label: 'Select a resource definition', isDisabled: true, isPlaceholder: true }].concat(
                resourceDefinitionList.map((e) => ({
                  label: e.name,
                  value: e.name,
                  isDisabled: false,
                }))
              ),
        },
      },
      {
        name: 'allocate_method',
        hide: editing,
        type: TYPE_MAP.RADIO,
        label: 'Allocate Method',
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Please select',
        },
        needWatch: true,
        watchCallback: (allocate_method: string) => {
          setAllocateMethod(allocate_method);
        },
        defaultValue: initialVal?.allocate_method ?? 'manual',
        extraInfo: {
          options: [
            {
              label: 'Manual',
              value: 'manual',
              isDisabled: false,
            },
            {
              label: 'Auto',
              value: 'auto',
              isDisabled: false,
            },
          ],
        },
      },
      {
        name: 'node',
        type: TYPE_MAP.SINGLE_SELECT,
        label: 'Node',
        hide: allocateMethod === 'auto',
        defaultValue: initialVal?.node,
        isDisabled: editing,
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Node is required',
        },
        extraInfo: {
          options: nodeListLoading
            ? []
            : [{ value: '', label: 'Select a node', isDisabled: true, isPlaceholder: true }].concat(
                nodeList.map((e) => ({
                  label: e.name,
                  value: e.name,
                  isDisabled: false,
                }))
              ),
        },
        needWatch: true,
        watchCallback: async (val) => {
          if (val !== 'Select a node') {
            console.log(val, 'val');
            await getNodeNetworkLists(val);
          } else {
            setNodeNetWorksList([{ value: '', label: 'Select a node first', isDisabled: true, isPlaceholder: true }]);
          }
        },
      },
      {
        name: 'diskless',
        type: TYPE_MAP.CHECKBOX,
        label: 'Diskless',
        hide: editing,
        defaultValue: initialVal?.diskless,
        validationInfo: {
          isRequired: false,
        },
      },
      {
        name: 'storage_pool',
        type: TYPE_MAP.SINGLE_SELECT,
        defaultValue: initialVal?.storage_pool,
        label: 'Storage Pool',
        extraInfo: {
          options: storagePoolListLoading
            ? []
            : [{ value: '', label: 'Select a storage pool', isDisabled: true, isPlaceholder: true }].concat(
                uniqby(
                  storagePoolList
                    ?.filter((e) => e.storage_pool_name !== 'DfltDisklessStorPool') // Filter all default storage pool
                    .map((e) => ({
                      label: e.storage_pool_name,
                      value: e.storage_pool_name,
                      isDisabled: false,
                    })),
                  'label'
                )
              ),
        },
      },
      {
        name: 'network_preference',
        type: TYPE_MAP.SINGLE_SELECT,
        label: 'Network Preference',
        hide: allocateMethod === 'auto',
        defaultValue: initialVal?.network_preference ?? '',
        validationInfo: {
          isRequired: false,
        },
        extraInfo: {
          options: nodeNetworkListLoading
            ? []
            : nodeNetWorksList.map((e) => ({
                label: e.label,
                value: e.value,
                isDisabled: e.isDisabled || false,
              })),
        },
      },
      {
        name: 'place_count',
        type: TYPE_MAP.INTEGER,
        hide: allocateMethod === 'manual',
        label: 'Auto Place Count',
        validationInfo: {
          isRequired: true,
          min: 1,
          invalidMessage: 'Auto place count must be a number',
        },
      },
    ];
  }, [
    initialVal?.resource_definition_name,
    initialVal?.allocate_method,
    initialVal?.node,
    initialVal?.diskless,
    initialVal?.storage_pool,
    initialVal?.network_preference,
    editing,
    resourceDefinitionLoading,
    resourceDefinitionList,
    allocateMethod,
    nodeListLoading,
    nodeList,
    storagePoolListLoading,
    storagePoolList,
    nodeNetworkListLoading,
    nodeNetWorksList,
    getNodeNetworkLists,
  ]);

  // Get interfaces of node
  useEffect(() => {
    (async function () {
      await getNodeNetworkLists(initialVal?.node);
    })();
  }, [getNodeNetworkLists, initialVal?.node]);

  const cancelClick = useCallback(() => {
    history.push('/storage-configuration/resources');
  }, [history]);

  return (
    <DynamicForm formItems={formItems as FormItem[]} handleSubmitData={handleSubmit} handleCancelClick={cancelClick} />
  );
};

export default ResourceForm;
