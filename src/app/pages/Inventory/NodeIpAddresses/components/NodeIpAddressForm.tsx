import React, { useMemo, useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';

import DynamicForm from '@app/components/DynamicForm';
import { TYPE_MAP } from '@app/interfaces/dynamicFormType';
import service from '@app/requests';
import { uniqId } from '@app/utils/stringUtils';

interface Props {
  handleSubmit: (node: string, data: { [key: string]: string | { [key: string]: string } }) => void;
  initialVal?: { [key: string]: string | number | boolean | Array<string> };
  loading?: boolean;
  editing?: boolean;
}

const NodeIpAddressForm: React.FC<Props> = ({ initialVal, handleSubmit, loading, editing }) => {
  const history = useHistory();

  const [nodeList, setNodeList] = useState<SelectOptions>([]);

  const { loading: nodeListLoading } = useRequest('/v1/nodes', {
    requestMethod: (params) => service.get(params),
    onSuccess: (res) => {
      const nodeListOption = res.data.map((e) => ({ value: e.name, label: e.name, isDisabled: false }));
      nodeListOption.unshift({ value: '', label: 'Select a node', isDisabled: true, isPlaceholder: true });
      setNodeList(nodeListOption);
    },
  });

  const formItems = useMemo(() => {
    return [
      {
        id: uniqId(),
        name: 'node',
        type: TYPE_MAP.SINGLE_SELECT,
        label: 'Node',
        defaultValue: initialVal?.node ?? '',
        isDisabled: editing,
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Node is required',
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
        name: 'name',
        type: TYPE_MAP.TEXT,
        label: 'Alias',
        isDisabled: editing,
        defaultValue: initialVal?.name || '',
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Alias is invalid',
        },
      },
      {
        id: uniqId(),
        name: 'address',
        type: TYPE_MAP.TEXT,
        label: 'IP Address',
        defaultValue: initialVal?.address ?? '',
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'IP Address is invalid',
        },
      },
      {
        id: uniqId(),
        name: 'satellite_port',
        type: TYPE_MAP.TEXT,
        label: 'TCP Port',
        defaultValue: initialVal?.satellite_port ?? '',
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'TCP port is invalid',
        },
      },
      {
        id: uniqId(),
        name: 'is_active',
        type: TYPE_MAP.CHECKBOX,
        label: 'Default IP',
        defaultValue: initialVal?.is_active || false,
        validationInfo: {
          isRequired: false,
        },
      },
    ];
  }, [
    editing,
    initialVal?.address,
    initialVal?.is_active,
    initialVal?.name,
    initialVal?.node,
    initialVal?.satellite_port,
    nodeList,
    nodeListLoading,
  ]);

  const handleSubmitClick = (data) => {
    const { node, name, address, satellite_port, is_active } = data;

    const ipData = {
      name,
      address,
      satellite_port,
      is_active,
      satellite_encryption_type: 'plain',
    };

    handleSubmit(node, ipData);
  };

  const cancelClick = useCallback(() => {
    history.push('/inventory/ip');
  }, [history]);

  return <DynamicForm formItems={formItems} handleSubmitData={handleSubmitClick} handleCancelClick={cancelClick} />;
};

export default NodeIpAddressForm;
