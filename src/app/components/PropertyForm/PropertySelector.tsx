// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, ExpandableSection, Select, SelectOption, SelectVariant } from '@patternfly/react-core';

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
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState();
  const [isExpanded, setIsExpanded] = useState(false);

  const titleId = 'select-descriptions-title';

  const clearSelection = () => {
    setIsOpen(false);
    setSelected(undefined);
  };

  const onToggle = (isOpen) => {
    setIsOpen(isOpen);
  };

  const onSelect = (event, selection, isPlaceholder) => {
    if (isPlaceholder) {
      clearSelection();
    } else {
      setIsOpen(false);
      setSelected(selection);
    }
  };

  const handleAdd = () => {
    if (typeof selected !== 'undefined') {
      handleAddProperty(selected || '');
      setSelected(undefined);
    }
  };

  return (
    <div style={{ marginBottom: '1em' }}>
      <span id={titleId} hidden>
        Select Property
      </span>
      <Select
        variant={SelectVariant.typeahead}
        placeholderText="Select a property"
        aria-label="Select Input with descriptions"
        onToggle={onToggle}
        onSelect={onSelect}
        selections={selected}
        isOpen={isOpen}
        aria-labelledby={titleId}
        width={400}
      >
        {options?.map((option, index) => (
          <SelectOption
            isDisabled={option.isDisabled}
            key={index}
            value={option.value}
            isPlaceholder={option.isPlaceholder}
            description={option?.description || ''}
          />
        ))}
      </Select>
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
