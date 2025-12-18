// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

export interface SupportStatusProps {
  supported?: boolean;
  className?: string;
}

export const SupportStatus: React.FC<SupportStatusProps> = ({ supported, className = '' }) => {
  return (
    <span className={className}>
      {supported ? (
        <CheckCircleFilled style={{ color: 'green', fontSize: '16px' }} />
      ) : (
        <CloseCircleFilled style={{ color: 'grey', fontSize: '16px' }} />
      )}
    </span>
  );
};
