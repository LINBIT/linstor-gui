// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Select, Tooltip } from 'antd';
import { Button, ExpandableSection } from '@patternfly/react-core';

import './index.css';

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

const PropertySelector: React.FC<PropertySelectorProps> = ({
  options,
  handleAddProperty,
  handleAddAuxProp,
  handleDeleteAllAuxProp,
}) => {
  const [selected, setSelected] = useState<string>();
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div style={{ marginBottom: '1em' }}>
      <Select
        showSearch
        placeholder="Select a property"
        size="large"
        options={options}
        style={{
          width: '90%',
        }}
        allowClear
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
      <Button className="add" variant="primary" onClick={handleAdd}>
        Add
      </Button>

      <ExpandableSection
        toggleText={isExpanded ? 'Show less' : 'Show more'}
        onToggle={() => setIsExpanded(!isExpanded)}
        isExpanded={isExpanded}
      >
        <React.Fragment>
          <Button className="add" variant="primary" onClick={() => handleAddAuxProp()}>
            Add Auxiliary Property
          </Button>
          <Button className="add" variant="danger" onClick={() => handleDeleteAllAuxProp()}>
            Delete All Properties
          </Button>
        </React.Fragment>
      </ExpandableSection>
    </div>
  );
};

export default PropertySelector;
