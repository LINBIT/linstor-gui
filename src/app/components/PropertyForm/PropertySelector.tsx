// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Select, Tooltip } from 'antd';

import './index.css';
import Button from '@app/components/Button';

interface PropertySelectorProps {
  options: Array<
    SelectOptions[0] & {
      description?: string;
    }
  >;
  handleAddProperty: (propertyName: string) => void;
  handleAddAuxProp: () => void;
  handleDeleteAllAuxProp: () => void;
}

const PropertySelector: React.FC<PropertySelectorProps> = ({ options, handleAddProperty, handleAddAuxProp }) => {
  const [selected, setSelected] = useState<string>();

  const handleAdd = () => {
    if (typeof selected !== 'undefined') {
      handleAddProperty(selected || '');
      setSelected(undefined);
    }
  };

  const handleChange = (value: string) => {
    setSelected(value);
  };

  return (
    <div className="mb-4 flex items-center">
      <Select
        showSearch
        placeholder="Select a property"
        size="large"
        options={options}
        style={{
          width: '70%',
        }}
        allowClear
        value={selected}
        onChange={handleChange}
        optionRender={(option) => (
          <div>
            <Tooltip placement="top" title={option.data.description}>
              <div aria-label={option.data.label}>{option.data.label}</div>

              <code>
                <small>{option.data.description}</small>
              </code>
            </Tooltip>
          </div>
        )}
      />
      <Button className="add" type="primary" onClick={handleAdd} disabled={!selected}>
        Add
      </Button>

      <Button className="add" type="secondary" onClick={() => handleAddAuxProp()}>
        Add Auxiliary Property
      </Button>
    </div>
  );
};

export default PropertySelector;
