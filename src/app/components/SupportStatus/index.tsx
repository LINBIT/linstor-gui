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
        <CheckCircleFilled className="text-[16px] text-(--text-chip-success)" />
      ) : (
        <CloseCircleFilled className="text-[16px] text-(--icon-muted)" />
      )}
    </span>
  );
};
