import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import DynamicForm from '@app/components/DynamicForm';
import { TYPE_MAP } from '@app/interfaces/dynamicFormType';
import { uniqId } from '@app/utils/stringUtils';

type NodeType = { node: string; ip: string; port: string };

interface Props {
  handleSubmit: (node) => void;
  initialVal?: NodeType;
  loading?: boolean;
  editing?: boolean;
}

const NodeForm: React.FC<Props> = ({ initialVal, handleSubmit, loading, editing }) => {
  const history = useHistory();
  const { t } = useTranslation('node');

  const formItems = useMemo(() => {
    return [
      {
        name: 'node',
        type: TYPE_MAP.TEXT,
        label: t('node_name'),
        isDisabled: editing,
        defaultValue: initialVal?.node ?? '',
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Please provide node name',
        },
      },
      {
        name: 'ip',
        type: TYPE_MAP.TEXT,
        label: t('default_ip'),
        defaultValue: initialVal?.ip ?? '',
        validationInfo: {
          isRequired: true,
          minLength: 2,
          invalidMessage: 'Please provide default ip',
        },
      },
      {
        name: 'port',
        type: TYPE_MAP.INTEGER,
        label: t('default_port'),
        defaultValue: initialVal?.port || '3366',
        validationInfo: {
          isRequired: true,
          min: 1024,
          invalidMessage: 'Please provide default port',
        },
      },
    ].map((e) => ({ ...e, id: uniqId() }));
  }, [t, editing, initialVal?.node, initialVal?.ip, initialVal?.port]);

  return (
    <DynamicForm
      initialVal={initialVal}
      submitting={loading}
      handleSubmitData={(data) => handleSubmit(data)}
      formItems={formItems}
      handleCancelClick={() => history.push('/inventory/nodes')}
    />
  );
};

export default NodeForm;
