// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Select } from 'antd';
import styled from '@emotion/styled';
import { ClockCircleOutlined } from '@ant-design/icons';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;

  .time-range-label {
    font-weight: 500;
    margin-right: 12px;
    color: #666;
  }

  .ant-select {
    min-width: 160px;
  }
`;

// Time range options similar to Grafana's default
export const TIME_RANGE_OPTIONS = [
  { label: 'Last 5 minutes', value: 'now-5m' },
  { label: 'Last 15 minutes', value: 'now-15m' },
  { label: 'Last 30 minutes', value: 'now-30m' },
  { label: 'Last 1 hour', value: 'now-1h' },
  { label: 'Last 3 hours', value: 'now-3h' },
  { label: 'Last 6 hours', value: 'now-6h' },
  { label: 'Last 12 hours', value: 'now-12h' },
  { label: 'Last 24 hours', value: 'now-24h' },
  { label: 'Last 2 days', value: 'now-2d' },
  { label: 'Last 7 days', value: 'now-7d' },
  { label: 'Last 30 days', value: 'now-30d' },
  { label: 'Last 90 days', value: 'now-90d' },
];

export interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  allowClear?: boolean;
  defaultValue?: string;
  options?: { label: string; value: string }[];
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  label = 'Time Range:',
  placeholder = 'Select time range',
  allowClear = true,
  defaultValue = 'now-1h',
  options = TIME_RANGE_OPTIONS,
}) => {
  const handleClear = () => {
    onChange(defaultValue);
  };

  return (
    <Container>
      <ClockCircleOutlined style={{ marginRight: 8, color: '#666' }} />
      <span className="time-range-label">{label}</span>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        allowClear={allowClear}
        onClear={handleClear}
      />
    </Container>
  );
};

export default TimeRangeSelector;
