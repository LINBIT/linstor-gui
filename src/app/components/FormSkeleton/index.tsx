// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Skeleton } from 'antd';

interface FormSkeletonProps {
  /** How many fields the form has, so the page does not jump when it arrives. */
  fields: number;
  /** Two columns from lg on, as the forms that lay their fields out in two. */
  columns?: 1 | 2;
  className?: string;
}

/**
 * Stands in for a vertical form while the values it opens with are loading:
 * a label over a field, per field, then the submit button.
 */
export const FormSkeleton: React.FC<FormSkeletonProps> = ({ fields, columns = 1, className }) => (
  <div aria-busy="true" className={className}>
    <div className={columns === 2 ? 'grid gap-x-6 lg:grid-cols-2' : undefined}>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="mb-6">
          <Skeleton.Input active size="small" className="mb-2 block !w-32 !min-w-0" />
          <Skeleton.Input active size="large" block />
        </div>
      ))}
    </div>
    <Skeleton.Button active size="large" />
  </div>
);
