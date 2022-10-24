import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  PageSection,
  Spinner,
  Title,
  PageSectionVariants,
} from '@patternfly/react-core';

import './index.css';

interface Props {
  title: string;
  loading?: boolean;
  error?: Error | undefined | boolean;
  alerts?: alertList;
}

const PageBasic: React.FC<PropsWithChildren<Props>> = ({ alerts, loading, error, title, children }) => {
  // loading state
  if (loading) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner size="xl" />
        </Bullseye>
      </PageSection>
    );
  }

  // error state
  if (error) {
    return (
      <PageSection>
        <EmptyState variant={EmptyStateVariant.large}>
          <Title headingLevel="h2" size="lg" key="empty_title">
            Unable to connect
          </Title>
          <EmptyStateBody key="empty_body">
            There was an error retrieving data. Check your connection and try again.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection variant={PageSectionVariants.light}>
      <Title headingLevel="h1" size="lg">
        {title}
      </Title>
      <div className="content">{children}</div>
    </PageSection>
  );
};

export default PageBasic;
