import React, { useState, useCallback } from 'react';
import { Input, Button, message } from 'antd';
import styled from '@emotion/styled';
import { useMutation } from '@tanstack/react-query';
import { enterPassPhrase } from '@app/features/settings/passphrase';

const Wrapper = styled.div`
  padding: 2em 0;
  width: 20em;
`;

const Label = styled.span`
  margin-bottom: 1em;
`;

const Passphrase: React.FC = () => {
  const [passphrase, setPassphrase] = useState('');
  const [messageApi, contextHolder] = message.useMessage();

  const enterPassphrase = useMutation({
    mutationKey: ['enterPassPhrase'],
    mutationFn: (passphrase: string) => {
      return enterPassPhrase(passphrase);
    },
    onMutate: () => {
      messageApi.open({
        type: 'info',
        content: 'Saving passphrase...',
      });
    },
    onSuccess: () => {
      messageApi.open({
        type: 'success',
        content: 'Passphrase saved successfully.',
      });
    },
    onError: () => {
      messageApi.open({
        type: 'error',
        content: 'Failed to save passphrase.',
      });
    },
  });

  const handleSave = useCallback(() => {
    if (!passphrase) {
      messageApi.open({
        type: 'error',
        content: 'Please enter the Grafana URL.',
      });
      return;
    } else {
      console.log('Save', passphrase);
      enterPassphrase.mutate(passphrase);
    }
  }, [passphrase, messageApi, enterPassphrase]);

  return (
    <>
      {contextHolder}
      <Wrapper>
        <Label>LINSTOR Passphrase</Label>
        <Input.Password
          value={passphrase}
          onChange={(e) => {
            setPassphrase(e.target.value);
          }}
          aria-label="pass-phrase"
          type="password"
          width={100}
        />
      </Wrapper>
      <Button type="primary" onClick={handleSave}>
        Save
      </Button>
    </>
  );
};

export default Passphrase;
