// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useRef, useState } from 'react';
import { Space } from 'antd';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const size = convertRoundUp(sizeUnit, Number(val));
    setInputVal(val);
    if (onChange) {
      onChange(size);
    }
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
    // The unit picker is a control, not text: it joins the input in a
    // Space.Compact rather than sitting in a (grey) addon.
    <Space.Compact block style={style}>
      <Input
        type="number"
        min={0}
        placeholder={placeholder || 'Please input size'}
        value={inputVal}
        onChange={handleInputChange}
        disabled={disabled}
      />
      <Select
        disabled={disabled}
        options={sizeOptions?.map((e) => ({
          label: e.label,
          value: e.value,
        }))}
        defaultValue={sizeOptions[2].value}
        onChange={(unit) => {
          sizeUnitSet.current = true;
          setSizeUnit(unit);
          // The number stays, so the size it stands for changes with the unit.
          if (inputVal !== '' && onChange) {
            onChange(convertRoundUp(unit, Number(inputVal)));
          }
        }}
        value={sizeUnit}
        style={{ width: 96, flex: 'none' }}
      />
    </Space.Compact>
  );
};
