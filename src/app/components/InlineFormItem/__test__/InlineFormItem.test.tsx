// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Form } from 'antd';

import { Switch } from '@app/components/Switch';
import { Checkbox } from '@app/components/Checkbox';
import { InlineFormItem } from '../index';

const renderInForm = (item: React.ReactNode) =>
  render(
    <Form layout="vertical" size="large">
      {item}
    </Form>,
  );

describe('InlineFormItem', () => {
  it('puts the control on the label line of a label-above form, with no colon', () => {
    renderInForm(
      <InlineFormItem name="sed" label="SED Enabled" valuePropName="checked">
        <Switch />
      </InlineFormItem>,
    );
    const item = document.querySelector('.ant-form-item') as HTMLElement;
    expect(item).toHaveClass('ant-form-item-horizontal');
    expect(item.querySelector('.ant-form-item-label label')).toHaveClass('ant-form-item-no-colon');
    // No fixed label column: the label takes the width it needs.
    expect(item.querySelector('.ant-form-item-label')?.className).not.toMatch(/ant-col-\d/);
  });

  it('keeps the label naming the control, so it toggles it', () => {
    renderInForm(
      <InlineFormItem name="definitions_only" label="Definition only" valuePropName="checked">
        <Checkbox />
      </InlineFormItem>,
    );
    const box = screen.getByRole('checkbox', { name: 'Definition only' });
    expect(box).not.toBeChecked();
    fireEvent.click(screen.getByText('Definition only'));
    expect(box).toBeChecked();
  });

  it('puts extra under the whole line, not in the control column', () => {
    renderInForm(
      <InlineFormItem name="custom" label="Custom Logo" extra="Use your own logo" valuePropName="checked">
        <Switch />
      </InlineFormItem>,
    );
    const extra = screen.getByText('Use your own logo');
    expect(extra.closest('.ant-form-item')).toBeNull();
    expect(extra.previousElementSibling).toHaveClass('ant-form-item');
  });
});
