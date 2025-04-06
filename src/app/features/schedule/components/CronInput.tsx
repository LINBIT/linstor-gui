// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Space, Alert } from 'antd';
import cronParser from 'cron-parser';
import { Cron, CronError } from 'react-js-cron';

import { useCronReducer } from './useCronReducer';

import 'react-js-cron/dist/styles.css';

interface CronInputProps {
  value?: string; // cron expression value, e.g., '* * * * *'
  onChange?: (value: string) => void; // callback when value changes
}

const CronInput: React.FC<CronInputProps> = ({ value = '0 0 * * *', onChange }) => {
  const [values, dispatchValues] = useCronReducer(value);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempCronValue, setTempCronValue] = useState('');
  // Preview next executions for temporary value in modal
  const [previewExecutions, setPreviewExecutions] = useState<string[]>([]);
  // Error handling
  const [error, setError] = useState<CronError>(undefined);
  // Input validation error
  const [inputError, setInputError] = useState<string | null>(null);

  // Update the cron value when it changes in the modal
  const handleCronChange = (newValue: string) => {
    setTempCronValue(newValue);
  };

  // Validate cron expression
  const validateCronExpression = (expression: string): string | null => {
    if (!expression.trim()) {
      return 'Cron expression cannot be empty';
    }

    try {
      cronParser.parse(expression);
      return null;
    } catch (err) {
      return 'Invalid cron expression. Please check the format.';
    }
  };

  // Update the input value when it changes in the input field
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    // Clear error on change
    setInputError(null);

    dispatchValues({
      type: 'set_input_value',
      value: newValue,
    });
  };

  // Update the cron value when the input field loses focus
  const handleInputBlur = () => {
    const error = validateCronExpression(values.inputValue);
    setInputError(error);

    if (!error) {
      dispatchValues({
        type: 'set_cron_value',
        value: values.inputValue,
      });
      if (onChange) {
        onChange(values.inputValue);
      }
    }
  };

  // Close the modal and reset the input value to the cron value
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // Handle OK button click
  const handleOk = () => {
    // Don't apply if there's an error
    if (error) return;

    // Update both cron value and input value
    dispatchValues({
      type: 'set_values',
      value: tempCronValue,
    });
    if (onChange) {
      onChange(tempCronValue);
    }
    setIsModalOpen(false);
  };

  // Open modal and initialize temporary value
  const handleOpenModal = () => {
    setTempCronValue(values.cronValue);
    setIsModalOpen(true);
  };

  // Handle errors from Cron component
  const handleError = (err: CronError) => {
    setError(err);
  };

  useEffect(() => {
    if (!tempCronValue) return;

    try {
      const interval = cronParser.parse(tempCronValue);
      const nextTimes = [];
      for (let i = 0; i < 5; i++) {
        nextTimes.push(interval.next().toString());
      }
      setPreviewExecutions(nextTimes);
    } catch (err) {
      setPreviewExecutions(['Invalid Cron Expression']);
    }
  }, [tempCronValue]);

  // Validate initial value
  useEffect(() => {
    const error = validateCronExpression(values.inputValue);
    setInputError(error);
  }, []);

  return (
    <div className="cron-input-container">
      <Input
        value={values.inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder="Cron Expression"
        status={inputError ? 'error' : ''}
        addonAfter={
          <Button type="link" onClick={handleOpenModal}>
            Open Cron Editor
          </Button>
        }
      />

      {inputError && (
        <div className="mt-1">
          <Alert message={inputError} type="error" showIcon style={{ padding: '2px 8px', fontSize: '12px' }} />
        </div>
      )}

      <Modal
        title="Cron Editor"
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={
          <Space>
            <Button onClick={handleModalClose}>Cancel</Button>
            <Button type="primary" onClick={handleOk} disabled={!!error}>
              OK
            </Button>
          </Space>
        }
        width={800}
        destroyOnClose
        height={600}
      >
        <div className="min-h-[100px]">
          <Cron value={tempCronValue} setValue={handleCronChange} onError={handleError} displayError={false} />
        </div>

        {error && (
          <div className="mt-2">
            <Alert message="Invalid Cron Expression" description={error.description} type="error" showIcon />
          </div>
        )}

        <div className="mt-4">
          <h3>Next 5 Execution Times:</h3>
          <ul>
            {previewExecutions.map((time, index) => (
              <li key={index}>
                <pre>{time}</pre>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default CronInput;
