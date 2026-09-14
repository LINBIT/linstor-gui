// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from 'antd';
import { Input } from '@app/components/Input';
import { DeleteOutlined } from '@ant-design/icons';
import { Button } from '@app/components/Button';

const { Text } = Typography;

type AuxProp = {
  name: string;
  value: string;
  id: string;
};

interface AuxiliaryPropInputProp {
  handleDeleteAuxProp: (id: string) => void;
  initialVal: AuxProp;
  onChange: ({ name, value, id }: AuxProp) => void;
  isFirst?: boolean;
}

const AuxiliaryPropInput: React.FC<AuxiliaryPropInputProp> = ({
  initialVal,
  handleDeleteAuxProp,
  onChange,
  isFirst = false,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (initialVal?.name && initialVal?.value) {
      setName(initialVal.name);
      setValue(initialVal.value);
    }
  }, [initialVal]);

  return (
    <div className="flex flex-col mb-3">
      {isFirst && (
        <div className="flex font-bold mb-2">
          <div className="w-2/5">
            <Text>Property Name</Text>
          </div>
          <div className="w-2/5">
            <Text>Property Value</Text>
          </div>
          <div className="w-1/5" />
        </div>
      )}
      <div className="flex items-center">
        <div className="w-2/5">
          <Input
            value={name}
            onChange={(e) => {
              const newName = e.target.value;
              setName(newName);
              onChange({ id: initialVal.id, name: newName, value });
            }}
            placeholder={t('common:please_input_property_name')}
          />
        </div>
        <div className="w-2/5 ml-2">
          <Input
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              setValue(newValue);
              onChange({ id: initialVal.id, name, value: newValue });
            }}
            placeholder={t('common:please_input_property_value')}
          />
        </div>
        <div className="w-1/5 text-right">
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteAuxProp(initialVal.id)} shape="circle" />
        </div>
      </div>
    </div>
  );
};

export default AuxiliaryPropInput;
