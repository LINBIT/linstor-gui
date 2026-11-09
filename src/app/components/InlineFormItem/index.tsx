// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Form } from 'antd';
import type { FormItemProps } from 'antd';

const INLINE = [
  '[&>.ant-form-item-row]:flex-nowrap [&>.ant-form-item-row]:items-center [&>.ant-form-item-row]:gap-x-3',
  '[&_.ant-form-item-label]:shrink [&_.ant-form-item-label]:whitespace-normal [&_.ant-form-item-label]:p-0',
  // A block, not antd's inline-flex: a wrapped label keeps its tooltip icon
  // after the last word instead of beside the whole text.
  '[&_.ant-form-item-label>label]:block [&_.ant-form-item-label>label]:h-auto',
  // antd keeps a blank in place of the colon; the gap above spaces the control.
  '[&_.ant-form-item-label>label::after]:hidden',
  '[&_.ant-form-item-control]:flex-none',
].join(' ');

/**
 * A form item for a short on/off control (a switch, a bare checkbox): the
 * control sits on the same line as its label instead of on a line of its own
 * under it, as the label-above layout of the forms would put it.
 *
 * The label keeps naming the control (label `for`, tooltip). It takes the
 * width it needs, with no fixed label column, and wraps when it is longer
 * than the line, so a long label or translation is never cut off and the
 * control never leaves the line.
 *
 * `extra` goes under the whole line: antd would put it beside the label, in
 * the control's column, which is only as wide as the switch.
 */
const InlineFormItem = ({ className, extra, ...props }: FormItemProps) => {
  const classes = [INLINE, extra ? 'mb-1!' : '', className].filter(Boolean).join(' ');
  const item = <Form.Item layout="horizontal" colon={false} labelAlign="left" className={classes} {...props} />;
  if (!extra) {
    return item;
  }
  return (
    <div className="mb-6">
      {item}
      <div className="text-(--ant-color-text-description) text-(length:--ant-font-size)">{extra}</div>
    </div>
  );
};

export { InlineFormItem };
