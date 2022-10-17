import React from 'react';
import { Label } from '@patternfly/react-core';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';

type StatusLabelProps = {
  status: 'success' | 'warning' | 'danger' | 'info';
  label: string;
  showIcon?: boolean;
};

const StatusLabel: React.FC<StatusLabelProps> = ({ status, label, showIcon }) => {
  const color = status === 'success' ? 'green' : status === 'warning' ? 'orange' : status === 'danger' ? 'red' : 'blue';
  return (
    <Label color={color} icon={showIcon ? <InfoCircleIcon /> : null}>
      {label}
    </Label>
  );
};

export { StatusLabel, StatusLabelProps };
