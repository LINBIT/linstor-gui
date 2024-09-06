// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import DynamicForm from '@app/components/DynamicForm';
import { TYPE_MAP } from '@app/interfaces/dynamicFormType';
import { uniqId } from '@app/utils/stringUtils';
import { convertRoundUp, sizeOptions } from '@app/utils/size';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';

type ISCSIType = {
  iqn: string;
  resource_group: string;
  volumes: {
    number: number;
    size_kib: number;
  };
  service_ips: string;
};

interface Props {
  handleSubmit: (node) => void;
  initialVal?: ISCSIType;
  loading?: boolean;
  editing?: boolean;
}

const ISCSIForm: React.FC<Props> = ({ initialVal, handleSubmit, loading, editing }) => {
  const history = useHistory();
  const { t } = useTranslation('iscsi');

  const { resourceGroupList } = useSelector((state: RootState) => ({
    resourceGroupList: state.resourceGroup.list,
  }));

  const formItems = useMemo(() => {
    return [
      {
        name: 'iqn',
        type: TYPE_MAP.TEXT,
        label: t('iqn'),
        isDisabled: editing,
        defaultValue: initialVal?.iqn ?? '',
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Please provide iqn',
        },
      },
      {
        name: 'resource_group',
        type: TYPE_MAP.SINGLE_SELECT,
        label: t('resource_group'),
        defaultValue: initialVal?.resource_group ?? '',
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Please provide resource group',
        },
        extraInfo: {
          options: resourceGroupList.map((e) => ({
            label: e.name,
            value: e.name,
            isDisabled: false,
          })),
        },
      },
      {
        name: 'service_ips',
        type: TYPE_MAP.TEXT,
        label: t('service_ips'),
        defaultValue: initialVal?.service_ips,
        validationInfo: {
          isRequired: true,
          min: 1024,
          invalidMessage: 'Please provide default service IP',
        },
      },
      {
        name: 'size',
        type: TYPE_MAP.SIZE,
        label: t('Size'),
        defaultValue: initialVal?.size,
        extraInfo: {
          options: sizeOptions.map((e) => ({ ...e, isDisabled: false })),
        },
        validationInfo: {
          isRequired: true,
          min: 1,
        },
      },
    ].map((e) => ({ ...e, id: uniqId() }));
  }, [
    t,
    editing,
    initialVal?.iqn,
    initialVal?.resource_group,
    initialVal?.service_ips,
    initialVal?.size,
    resourceGroupList,
  ]);

  const handleData = (data) => {
    const size = convertRoundUp(data.size.unit, data.size.number);
    handleSubmit({ ...data, service_ips: [data.service_ips], volumes: [{ number: 1, size_kib: size }] });
  };

  return (
    <DynamicForm
      initialVal={initialVal}
      submitting={loading}
      handleSubmitData={handleData}
      formItems={formItems}
      handleCancelClick={() => history.push('/gateway/iscsi')}
    />
  );
};

export default ISCSIForm;
