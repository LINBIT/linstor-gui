import React, { useMemo, useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import uniqby from 'lodash.uniqby';

import DynamicForm from '@app/components/DynamicForm';
import { TYPE_MAP, FormItem } from '@app/interfaces/dynamicFormType';
import { uniqId } from '@app/utils/stringUtils';

import './index.css';
import { toast } from 'react-toastify';

interface Props {
  handleSubmit: (data: { [key: string]: string | number | boolean | Array<string> }) => void;
  initialVal?: { [key: string]: string | number | boolean | Array<string> };
  loading?: boolean;
  editing?: boolean;
}

/**
 * options of layers
 */
const layerList = ['cache', 'storage', 'drbd', 'nvme', 'luks', 'writechache', 'openflex', 'exos'];
/**
 * options of providers
 */
const providerList = [
  'LVM',
  'LVM_THIN',
  'ZFS',
  'ZFS_THIN',
  'DISKLESS',
  'FILE',
  'FILE_THIN',
  'SPDK',
  'OPENFLEX_TARGET',
  'EXOS',
];

const ResourceGroupForm: React.FC<Props> = ({ initialVal, handleSubmit, editing }) => {
  const [deployFormItemsShow, setDeployFormItemsShow] = useState(false);
  const history = useHistory();

  const { data: storagePoolList, loading: storagePoolListLoading } = useRequest('/v1/view/storage-pools');

  const formItems = useMemo(() => {
    const handledStorageList = storagePoolList
      ?.filter((e) => e.storage_pool_name !== 'DfltDisklessStorPool')
      .map((e) => ({
        label: e.storage_pool_name,
        value: e.storage_pool_name,
        isDisabled: false,
      }));

    return [
      {
        name: 'name',
        isDisabled: editing,
        type: TYPE_MAP.TEXT,
        label: 'Resource Group Name',
        defaultValue: initialVal?.name ?? '',
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Resource group name is invalid',
        },
      },
      {
        name: 'provider_list',
        type: TYPE_MAP.MULTIPLE_SELECT,
        label: 'Providers',
        defaultValue: initialVal?.provider_list ?? [],
        validationInfo: {
          isRequired: false,
        },
        extraInfo: {
          options: providerList.map((e) => ({
            label: e,
            value: e,
            isDisabled: false,
          })),
        },
      },
      {
        name: 'layer_stack',
        type: TYPE_MAP.MULTIPLE_SELECT,
        defaultValue: initialVal?.layer_stack ?? [],
        label: 'Layers',
        validationInfo: {
          isRequired: false,
        },
        extraInfo: {
          options: layerList.map((e) => ({
            label: e,
            value: e,
            isDisabled: false,
          })),
        },
        needWatch: true,
        watchCallback: (layers: Array<string>) => {
          if (layers.includes('drbd')) {
            toast('Please make sure you have drbd-kmod installed on the nodes you wish to use DRBD on', {
              type: 'info',
            });
          }
        },
      },
      {
        name: 'description',
        type: TYPE_MAP.TEXTAREA,
        defaultValue: initialVal?.description ?? '',
        label: 'Description',
        validationInfo: {
          isRequired: false,
        },
      },
      {
        name: 'place_count',
        type: TYPE_MAP.INTEGER,
        defaultValue: initialVal?.place_count ?? 2,
        label: 'Place Count',
        validationInfo: {
          isRequired: true,
          min: 1,
          invalidMessage: 'Place count must be a number',
        },
      },
      {
        name: 'storage_pool_list',
        type: TYPE_MAP.MULTIPLE_SELECT,
        label: 'Storage Pool',
        defaultValue: initialVal?.storage_pool_list ?? [],
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Replication mode is required',
        },
        extraInfo: {
          options: storagePoolListLoading ? [] : uniqby(handledStorageList, 'value'),
        },
      },
      {
        name: 'data_copy_mode',
        type: TYPE_MAP.RADIO,
        label: 'Replication Mode',
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Please select',
        },
        defaultValue: initialVal?.data_copy_mode ?? 'C',
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
        name: 'diskless_on_remaining',
        type: TYPE_MAP.CHECKBOX,
        label: 'Diskless',
        defaultValue: initialVal?.diskless_on_remaining ?? false,
        validationInfo: {
          isRequired: false,
        },
      },
      {
        name: 'deploy',
        type: TYPE_MAP.RADIO,
        label: 'Deploy',
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Please select',
        },
        hide: editing,
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
        name: 'resource_definition_name',
        type: TYPE_MAP.TEXT,
        label: 'Resource Definition Name',
        hide: !deployFormItemsShow,
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Resource definition name is invalid',
        },
      },
      {
        name: 'volume_size',
        type: TYPE_MAP.INTEGER, // TODO: ADD A TYPE FOR SIZE INPUT
        label: 'Volume Size',
        hide: !deployFormItemsShow,
        validationInfo: {
          isRequired: true,
          invalidMessage: 'Volume size must be a number',
        },
      },
      {
        name: 'definition_only',
        type: TYPE_MAP.CHECKBOX,
        label: 'Definition Only',
        hide: !deployFormItemsShow,
      },
    ];
  }, [
    editing,
    initialVal?.name,
    initialVal?.data_copy_mode,
    initialVal?.diskless_on_remaining,
    initialVal?.place_count,
    initialVal?.description,
    initialVal?.storage_pool_list,
    initialVal?.layer_stack,
    initialVal?.provider_list,
    storagePoolListLoading,
    storagePoolList,
    deployFormItemsShow,
  ]);

  // Extra items
  const advanceFormItems = useMemo(() => {
    return [
      {
        id: uniqId(),
        name: 'replicas_on_same',
        type: TYPE_MAP.MULTIPLE_SELECT,
        defaultValue: initialVal?.replicas_on_same ?? [],
        label: 'Replicas On Same',
        extraInfo: {
          options: [],
          isCreatable: true,
        },
      },
      {
        id: uniqId(),
        name: 'replicas_on_different',
        type: TYPE_MAP.MULTIPLE_SELECT,
        defaultValue: initialVal?.replicas_on_different ?? [],
        label: 'Replicas On Different',
        extraInfo: {
          options: [],
          isCreatable: true,
        },
      },
      {
        id: uniqId(),
        name: 'not_place_with_rsc',
        defaultValue: initialVal?.not_place_with_rsc ?? '',
        type: TYPE_MAP.TEXT,
        label: 'Do Not Place With',
      },
      {
        id: uniqId(),
        name: 'not_place_with_rsc_regex',
        type: TYPE_MAP.TEXT,
        defaultValue: initialVal?.not_place_with_rsc_regex ?? '',
        label: 'Do Not Place With Regex',
      },
    ];
  }, [
    initialVal?.not_place_with_rsc,
    initialVal?.not_place_with_rsc_regex,
    initialVal?.replicas_on_different,
    initialVal?.replicas_on_same,
  ]);

  const cancelClick = useCallback(() => {
    history.push('/software-defined/resource-groups');
  }, [history]);

  return (
    <DynamicForm
      formItems={formItems as FormItem[]}
      handleSubmitData={handleSubmit}
      handleCancelClick={cancelClick}
      hasAdvancedItems
      advanceFormItems={advanceFormItems}
    />
  );
};

export default ResourceGroupForm;
