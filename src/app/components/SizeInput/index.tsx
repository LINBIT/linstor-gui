import React, { useState } from 'react';
import { Input, Select } from 'antd';
import { convertRoundUp, sizeOptions } from '@app/utils/size';

type SizeInputProps = {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
};

export const SizeInput = ({ value, onChange, placeholder }: SizeInputProps) => {
  const [sizeUnit, setSizeUnit] = useState('GiB');
  const [inputVal, setInputVal] = useState(value || '');

  const handleInputChange = (e) => {
    const val = e.target.value;
    const size = convertRoundUp(sizeUnit, val);
    setInputVal(val);
    onChange && onChange(size);
  };

  return (
    <Input
      addonAfter={
        <Select
          options={sizeOptions?.map((e) => ({
            label: e.label,
            value: e.value,
          }))}
          defaultValue={sizeOptions[2].value}
          onChange={(value) => {
            setSizeUnit(value);
          }}
          value={sizeUnit}
        />
      }
      type="number"
      min={0}
      placeholder={placeholder || 'Please input size'}
      value={inputVal}
      onChange={handleInputChange}
    />
  );
};
