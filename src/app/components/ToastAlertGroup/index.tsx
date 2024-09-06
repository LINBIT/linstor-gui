// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Alert, AlertGroup, AlertActionCloseButton, AlertVariant } from '@patternfly/react-core';
interface Props {
  alerts?: Array<{ title: string; variant: string; key: string }>;
  handleCloseAlert?: (key: string) => void;
}

const ToastAlertGroup: React.FC<Props> = ({ alerts, handleCloseAlert }) => {
  return (
    <AlertGroup isToast>
      {alerts?.map(({ key, variant, title }) => (
        <Alert
          variant={AlertVariant[variant]}
          title={title}
          key={key}
          timeout={3000}
          actionClose={
            <AlertActionCloseButton
              title={title}
              variantLabel={`${variant} alert`}
              onClose={() => handleCloseAlert && handleCloseAlert(key)}
            />
          }
        />
      ))}
    </AlertGroup>
  );
};

export default ToastAlertGroup;
