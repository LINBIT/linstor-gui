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

/** The color sits on a wrapper the icon inherits from: antd's static message
 *  holder injects an unlayered `.anticon { color: inherit }` that would beat a
 *  utility class on the icon itself. */
export const SupportStatus: React.FC<SupportStatusProps> = ({ supported, className = '' }) => {
  return (
    <span className={className}>
      {supported ? (
        <span className="text-(--icon-success)">
          <CheckCircleFilled className="text-[16px]" />
        </span>
      ) : (
        <span className="text-(--icon-muted)">
          <CloseCircleFilled className="text-[16px]" />
        </span>
      )}
    </span>
  );
};
