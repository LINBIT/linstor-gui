import React, { useState, useMemo, useCallback, useEffect } from 'react';

import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { TYPE_MAP } from '@app/interfaces/dynamicFormType';
import DynamicForm from '@app/components/DynamicForm';
import { uniqId } from '@app/utils/stringUtils';

// TODO
type StoragePoolType = {
  node: string;
  name?: string;
  type?: string;
  network_preference?: string;
  storage_driver_name?: string;
};

// TODO
interface Props {
  handleSubmit: (node: string, data: { [key: string]: string | { [key: string]: string } }) => void;
  initialVal?: StoragePoolType;
  loading?: boolean;
  editing?: boolean;
}

const TYPE_LIST = [
  { value: '', label: 'Select type', isDisabled: true, isPlaceholder: true },
  { label: 'LVM', value: 'LVM', isDisabled: false },
  { label: 'LVM_THIN', value: 'LVM_THIN', isDisabled: false },
];

const StoragePoolForm: React.FC<Props> = ({ initialVal, handleSubmit, loading, editing }) => {
  const [nodeList, setNodeList] = useState<SelectOptions>([]);
  const [nodeNetWorksList, setNodeNetWorksList] = useState<SelectOptions>([]);

  const { loading: nodeListLoading } = useRequest(() => ({ url: `/v1/nodes` }), {
    onSuccess: (data) => {
      const nodeListOption = data.map((e) => ({ value: e.name, label: e.name, isDisabled: false }));
      nodeListOption.unshift({ value: '', label: 'Select a node', isDisabled: true, isPlaceholder: true });
      setNodeList(nodeListOption);
    },
  });

  const { run: getNodeNetworkLists, loading: nodeNetworkListLoading } = useRequest(
    (node) => ({
      url: `/v1/nodes/${node}/net-interfaces`,
    }),
    {
      manual: true,
      onSuccess: (data) => {
        const nodeNetworkListOption = data.map((e) => ({ value: e.name, label: e.name, isDisabled: false }));
        nodeNetworkListOption.unshift({ value: '', label: 'Select a network', isDisabled: true, isPlaceholder: true });
        setNodeNetWorksList(nodeNetworkListOption);
      },
    }
  );

  const history = useHistory();

  const formItems = useMemo(() => {
    console.log(initialVal, 'initialVal');
    return [
      {
        id: uniqId(),
        name: 'name',
        type: TYPE_MAP.TEXT,
        isDisabled: editing,
        label: 'Storage Pool Name',
        defaultValue: initialVal?.name ?? '',
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Storage pool name is invalid',
        },
      },
      {
        id: uniqId(),
        name: 'node',
        type: TYPE_MAP.SINGLE_SELECT,
        label: 'Node',
        isDisabled: editing,
        defaultValue: initialVal?.node ?? '',
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Node is required',
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
        extraInfo: {
          options: nodeListLoading
            ? []
            : nodeList.map((e) => ({
                label: e.label,
                value: e.value,
                isDisabled: e.isDisabled || false,
              })),
        },
      },
      {
        id: uniqId(),
        name: 'type',
        type: TYPE_MAP.SINGLE_SELECT,
        label: 'Type',
        isDisabled: editing,
        defaultValue: initialVal?.type ?? '',
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Type is required',
        },
        extraInfo: {
          options: TYPE_LIST,
        },
      },
      {
        id: uniqId(),
        name: 'storage_driver_name',
        type: TYPE_MAP.TEXT,
        label: 'Storage Driver Name',
        defaultValue: initialVal?.storage_driver_name ?? '',
        isDisabled: editing,
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Storage driver name is required',
        },
      },
      {
        id: uniqId(),
        name: 'network_preference',
        type: TYPE_MAP.SINGLE_SELECT,
        label: 'Network Preference',
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
    ];
  }, [editing, getNodeNetworkLists, initialVal, nodeList, nodeListLoading, nodeNetWorksList, nodeNetworkListLoading]);

  useEffect(() => {
    (async function () {
      await getNodeNetworkLists(initialVal?.node);
    })();
  }, [getNodeNetworkLists, initialVal?.node]);

  const handleSubmitClick = (data) => {
    if (!loading) {
      const { node, name, type, storage_driver_name, network_preference } = data;

      const spData = {
        storage_pool_name: name,
        provider_kind: type,
        props: {
          'StorDriver/StorPoolName': storage_driver_name,
          PrefNic: network_preference,
        },
      };

      handleSubmit(node, spData);
    }
  };

  const cancelClick = useCallback(() => {
    history.push('/inventory/storage-pools');
  }, [history]);

  return <DynamicForm formItems={formItems} handleSubmitData={handleSubmitClick} handleCancelClick={cancelClick} />;
};

export default StoragePoolForm;
