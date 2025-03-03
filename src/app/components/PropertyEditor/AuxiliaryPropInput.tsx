// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useEffect } from 'react';
import { Input, Button, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

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
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (initialVal?.name && initialVal?.value) {
      setName(initialVal.name);
      setValue(initialVal.value);
    }
  }, [initialVal]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '12px' }}>
      {isFirst && (
        <div style={{ display: 'flex', fontWeight: 'bold', marginBottom: '8px' }}>
          <div style={{ width: '40%' }}>
            <Text>Property Name</Text>
          </div>
          <div style={{ width: '40%' }}>
            <Text>Property Value</Text>
          </div>
          <div style={{ width: '20%' }} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '40%' }}>
          <Input
            value={name}
            onChange={(e) => {
              const newName = e.target.value;
              setName(newName);
              onChange({ id: initialVal.id, name: newName, value });
            }}
            placeholder="Please input property name"
          />
        </div>
        <div style={{ width: '40%', marginLeft: '8px' }}>
          <Input
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              setValue(newValue);
              onChange({ id: initialVal.id, name, value: newValue });
            }}
            placeholder="Please input property value"
          />
        </div>
        <div style={{ width: '20%', textAlign: 'right' }}>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteAuxProp(initialVal.id)} shape="circle" />
        </div>
      </div>
    </div>
  );
};

export default AuxiliaryPropInput;
