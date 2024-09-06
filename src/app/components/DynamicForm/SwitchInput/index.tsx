// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Switch } from '@patternfly/react-core';
import { Control, Controller, FieldValues } from 'react-hook-form';

type SwitchInputProps = {
  name: string;
  label: string;
  id: string;
  labelOff?: string;
  control: Control<FieldValues, any> | undefined;
};

export const SwitchInput: React.FunctionComponent<SwitchInputProps> = ({ id, name, label, labelOff, control }) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <Switch id={id} label={label} labelOff={labelOff} isChecked={value} onChange={onChange} aria-label="Switch" />
      )}
    />
  );
};
