import React, { useCallback } from 'react';
import { Hint, HintTitle, HintBody, HintFooter, Button } from '@patternfly/react-core';
import { useHistory } from 'react-router-dom';

const NotEnable: React.FC = () => {
  const history = useHistory();

  const toLinbit = useCallback(() => {
    history.push('https://www.linbit.com/');
  }, [history]);

  return (
    <div style={{ width: '50%', margin: '2rem auto' }}>
      <Hint>
        <HintTitle>Product is not enabled.</HintTitle>
        <HintBody>
          Please contact{' '}
          <a href="https://www.linbit.com/" target="_blank" rel="noreferrer">
            LINBIT
          </a>{' '}
          to enable this product.
        </HintBody>
        <HintFooter>
          <Button variant="link" isInline onClick={toLinbit}>
            Contact
          </Button>
        </HintFooter>
      </Hint>
    </div>
  );
};

export default NotEnable;
