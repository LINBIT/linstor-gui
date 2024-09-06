// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import styled from '@emotion/styled';

import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import TimesCircleIcon from '@patternfly/react-icons/dist/esm/icons/times-circle-icon';

type YesOrNoContainerProps = {
  position?: 'left' | 'center';
};

const YesOrNoContainer = styled.div<YesOrNoContainerProps>`
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.position === 'center' ? 'center' : 'flex-start')};
  width: 100%;
  height: 100%;
`;

type YesOrNoProps = {
  value: boolean;
  position?: 'left' | 'center';
};

const YesOrNo: React.FC<YesOrNoProps> = ({ value, position = 'center' }: YesOrNoProps) => {
  return (
    <YesOrNoContainer position={position}>
      {value ? <CheckCircleIcon size="md" color="green" /> : <TimesCircleIcon size="md" color="gray" />}
    </YesOrNoContainer>
  );
};

export default YesOrNo;
