import React, { useCallback, useEffect, useState } from 'react';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core';

interface Props {
  name: string;
  id: string;
  options: Array<{ label: string; value: string; isDisabled: boolean }>;
  isCreatable?: boolean;
  value: Array<string>;
  onChange: (value: string[]) => void;
  style?: { width?: string };
}

const MultiSelect: React.FunctionComponent<Props> = ({ value, onChange, options, isCreatable, style = {} }) => {
  const [selected, setSelected] = useState<Array<string>>([]);
  const [isOpen, setIsOpen] = useState(false);

  const onSelect = useCallback(
    (selection) => {
      let newSelected: string[] = [];
      if (selected?.includes(selection)) {
        newSelected = selected.filter((item) => item !== selection);
      } else {
        newSelected = [...selected, selection];
      }
      setSelected(newSelected);
      onChange(newSelected);
    },
    [selected, onChange]
  );

  // set original value
  useEffect(() => {
    if (Array.isArray(value)) {
      setSelected(value);
    }
  }, [value]);

  return (
    <Select
      variant={SelectVariant.typeaheadMulti}
      typeAheadAriaLabel="Please select"
      onToggle={(val) => setIsOpen(val)}
      onSelect={(e, selection) => onSelect(selection)}
      selections={selected}
      isOpen={isOpen}
      placeholderText="Please select"
      isCreatable={isCreatable}
      style={style}
    >
      {options.map((option, index) => (
        <SelectOption isDisabled={option.isDisabled} key={index} value={option.value} />
      ))}
    </Select>
  );
};

export default MultiSelect;
