import React, { useState, useCallback } from 'react';
import { Switch } from '@patternfly/react-core';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

import { Dispatch } from '@app/store';

const Wrapper = styled.div`
  padding: 2em 0;
`;

const Label = styled.span`
  margin-right: 1em;
`;

const Gateway: React.FC = () => {
  const [isChecked, setIsChecked] = useState(false);
  const dispatch = useDispatch<Dispatch>();

  const handleChange = useCallback(
    (isChecked) => {
      setIsChecked(isChecked);
      if (isChecked) {
        dispatch.setting.getGatewayStatus();
      }
    },
    [dispatch.setting]
  );

  return (
    <Wrapper>
      <Label>Gateway mode</Label>
      <Switch isChecked={isChecked} onChange={handleChange} aria-label="gateway-mode" />
    </Wrapper>
  );
};

export default Gateway;
