// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useRef, useState } from 'react';
import { Input, Select } from 'antd';
import { convertRoundUp, sizeOptions } from '@app/utils/size';

type SizeInputProps = {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  defaultUnit?: string;
  style?: React.CSSProperties;
};

export const SizeInput = ({ value, onChange, placeholder, disabled, defaultUnit, style }: SizeInputProps) => {
  const [sizeUnit, setSizeUnit] = useState('GiB');
  const [inputVal, setInputVal] = useState(value || '');
  const sizeUnitSet = useRef(false);

  const handleInputChange = (e) => {
    const val = e.target.value;
    const size = convertRoundUp(sizeUnit, val);
    setInputVal(val);
    onChange && onChange(size);
  };

  useEffect(() => {
    if (disabled) {
      setSizeUnit('KiB');
      setInputVal(value ?? 0);
    }

    if (defaultUnit && !sizeUnitSet.current) {
      setSizeUnit(defaultUnit);
    }
  }, [value, disabled, defaultUnit, sizeUnit]);

  return (
    <Input
      style={style}
      addonAfter={
        <Select
          disabled={disabled}
          options={sizeOptions?.map((e) => ({
            label: e.label,
            value: e.value,
          }))}
          defaultValue={sizeOptions[2].value}
          onChange={(value) => {
            sizeUnitSet.current = true;
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
      disabled={disabled}
    />
  );
};
