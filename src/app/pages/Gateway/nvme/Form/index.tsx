import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import DynamicForm from '@app/components/DynamicForm';
import { TYPE_MAP } from '@app/interfaces/dynamicFormType';
import { uniqId } from '@app/utils/stringUtils';
import { convertRoundUp, sizeOptions } from '@app/utils/size';

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
        type: TYPE_MAP.TEXT,
        label: t('resource_group'),
        defaultValue: initialVal?.resource_group ?? '',
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Please provide resource group',
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
        label: t('size'),
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
  }, [t, editing, initialVal]);

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
      handleCancelClick={() => history.push('/gateway/nvme-of')}
    />
  );
};

export default ISCSIForm;
