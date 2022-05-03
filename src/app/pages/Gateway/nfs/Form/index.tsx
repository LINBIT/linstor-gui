import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import DynamicForm from '@app/components/DynamicForm';
import { TYPE_MAP } from '@app/interfaces/dynamicFormType';
import { uniqId } from '@app/utils/stringUtils';
import { convertRoundUp, sizeOptions } from '@app/utils/size';

type NFSType = {
  name: string;
  service_ip: string;
  size: {
    number: number;
    size_kib: number;
  };
};

interface Props {
  handleSubmit: (node) => void;
  initialVal?: NFSType;
  loading?: boolean;
  editing?: boolean;
}

const NFSForm: React.FC<Props> = ({ initialVal, handleSubmit, loading, editing }) => {
  const history = useHistory();
  const { t } = useTranslation('nfs');

  const formItems = useMemo(() => {
    return [
      {
        name: 'name',
        type: TYPE_MAP.TEXT,
        label: t('name'),
        isDisabled: editing,
        defaultValue: initialVal?.name ?? '',
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Please provide name',
        },
      },
      {
        name: 'service_ip',
        type: TYPE_MAP.TEXT,
        label: t('service_ip'),
        defaultValue: initialVal?.service_ip,
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
    console.log(data, 'data');
    const size = convertRoundUp(data.size.unit, data.size.number);
    handleSubmit({ ...data, volumes: [{ number: 1, size_kib: size, export_path: data.name }] });
  };

  return (
    <DynamicForm
      initialVal={initialVal}
      submitting={loading}
      handleSubmitData={handleData}
      formItems={formItems}
      handleCancelClick={() => history.push('/gateway/NFS')}
    />
  );
};

export default NFSForm;
