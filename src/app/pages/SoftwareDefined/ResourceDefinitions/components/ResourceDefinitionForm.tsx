// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useMemo, useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';

import DynamicForm from '@app/components/DynamicForm';
import { TYPE_MAP } from '@app/interfaces/dynamicFormType';
import { uniqId } from '@app/utils/stringUtils';
import { sizeOptions } from '@app/utils/size';
import uniqby from 'lodash.uniqby';

interface Props {
  handleSubmit: (data: { [key: string]: string | number | boolean | Array<string> }) => void;
  initialVal?: Record<string, unknown>;
  loading?: boolean;
  editing?: boolean;
}

const ResourceDefinitionForm: React.FC<Props> = ({ initialVal, handleSubmit, loading, editing }) => {
  const [deployFormItemsShow, setDeployFormItemsShow] = useState(false);
  const history = useHistory();

  const { data: resourceGroupList, loading: resourceGroupListLoading } = useRequest('/v1/resource-groups');
  const { data: storagePoolList, loading: storagePoolListLoading } = useRequest('/v1/view/storage-pools');

  const formItems = useMemo(() => {
    const handledStorageList = storagePoolList
      ?.filter((e) => e.storage_pool_name !== 'DfltDisklessStorPool')
      .map((e) => ({
        label: e.storage_pool_name,
        value: e.storage_pool_name,
        isDisabled: false,
      }))
      .concat({
        label: 'Please Select',
        value: '',
        isPlaceholder: true,
        isDisabled: true,
      });

    return [
      {
        id: uniqId(),
        name: 'resource_group_name',
        type: TYPE_MAP.SINGLE_SELECT,
        defaultValue: initialVal?.resource_group_name ?? [],
        label: 'Resource Group Name',
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Resource group name is invalid',
        },
        extraInfo: {
          options: resourceGroupListLoading
            ? []
            : resourceGroupList
                ?.map((e) => ({
                  label: e.name,
                  value: e.name,
                  isDisabled: false,
                }))
                .concat({
                  label: 'Please Select',
                  value: '',
                  isDisabled: true,
                  isPlaceholder: true,
                }),
        },
      },
      {
        id: uniqId(),
        name: 'name',
        label: 'Resource Definition Name',
        defaultValue: initialVal?.name ?? '',
        type: TYPE_MAP.TEXT,
        validationInfo: {
          pattern: /^[A-Za-z0-9.,+-]+$/,
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Resource definition name is invalid',
        },
      },
      {
        id: uniqId(),
        name: 'size',
        type: TYPE_MAP.SIZE,
        hide: editing,
        label: 'Size',
        defaultValue: initialVal?.size ?? { unit: 'KiB', number: 0 }, // TODO: initial value
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Size must be a number',
        },
        extraInfo: {
          options: sizeOptions.map((e) => ({ ...e, isDisabled: false })),
        },
      },
      {
        id: uniqId(),
        name: 'replication_mode',
        type: TYPE_MAP.RADIO,
        label: 'Replication Mode',
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Please select',
        },
        defaultValue: initialVal?.replication_mode ?? 'C',
        extraInfo: {
          options: [
            {
              label: 'Asynchronous',
              value: 'A',
              isDisabled: false,
            },
            {
              label: 'Synchronous',
              value: 'C',
              isDisabled: false,
            },
          ],
        },
      },
      {
        id: uniqId(),
        name: 'storage_pool',
        type: TYPE_MAP.SINGLE_SELECT,
        label: 'Storage Pool',
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Storage pool is required',
        },
        extraInfo: {
          options: storagePoolListLoading ? [] : uniqby(handledStorageList, 'value'),
        },
      },
      {
        id: uniqId(),
        name: 'deploy',
        hide: editing,
        type: TYPE_MAP.RADIO,
        label: 'Deploy',
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Please select',
        },
        defaultValue: 'no',
        needWatch: true,
        extraInfo: {
          options: [
            {
              label: 'Yes',
              value: 'yes',
              isDisabled: false,
            },
            {
              label: 'No',
              value: 'no',
              isDisabled: false,
            },
          ],
        },
        watchCallback: (show: string) => {
          setDeployFormItemsShow(show === 'yes');
        },
      },
      {
        id: uniqId(),
        name: 'place_count',
        type: TYPE_MAP.INTEGER,
        label: 'Place Count',
        hide: !deployFormItemsShow,
        validationInfo: {
          isRequired: true,
          min: 1,
          invalidMessage: 'Place count must be a number',
        },
      },
      {
        id: uniqId(),
        name: 'diskless',
        type: TYPE_MAP.CHECKBOX,
        hide: !deployFormItemsShow,
        label: 'Diskless',
        validationInfo: {
          isRequired: false,
        },
      },
    ];
  }, [
    storagePoolList,
    initialVal?.resource_group_name,
    initialVal?.name,
    initialVal?.size,
    initialVal?.replication_mode,
    resourceGroupListLoading,
    resourceGroupList,
    editing,
    storagePoolListLoading,
    deployFormItemsShow,
  ]);

  const cancelClick = useCallback(() => {
    history.push('/storage-configuration/resource-definitions');
  }, [history]);

  return <DynamicForm formItems={formItems} handleSubmitData={handleSubmit} handleCancelClick={cancelClick} />;
};

export default ResourceDefinitionForm;
