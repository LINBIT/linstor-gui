// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useEffect } from 'react';
import { Input, Button, Row, Col, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

import './AuxiliaryPropInput.css';

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
    <div className="aux-prop-container">
      {isFirst && (
        <Row className="aux-header" gutter={16}>
          <Col span={10}>
            <Text strong>Property Name</Text>
          </Col>
          <Col span={10}>
            <Text strong>Property Value</Text>
          </Col>
          <Col span={4}></Col>
        </Row>
      )}

      <Row gutter={16} className="aux-row">
        <Col span={10}>
          <Input
            value={name}
            onChange={(e) => {
              const newName = e.target.value;
              setName(newName);
              onChange({ id: initialVal.id, name: newName, value });
            }}
            placeholder="Please input property name"
          />
        </Col>

        <Col span={10}>
          <Input
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              setValue(newValue);
              onChange({ id: initialVal.id, name, value: newValue });
            }}
            placeholder="Please input property value"
          />
        </Col>

        <Col span={4} style={{ textAlign: 'center' }}>
          <Button danger icon={<DeleteOutlined />} shape="circle" onClick={() => handleDeleteAuxProp(initialVal.id)} />
        </Col>
      </Row>
    </div>
  );
};

export default AuxiliaryPropInput;
