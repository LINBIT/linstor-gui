import React from 'react';
import { Hint, HintTitle, HintBody, HintFooter, Button } from '@patternfly/react-core';

const NotEnable: React.FC = () => {
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
          <Button variant="link" isInline>
            Contact
          </Button>
        </HintFooter>
      </Hint>
    </div>
  );
};

export default NotEnable;
