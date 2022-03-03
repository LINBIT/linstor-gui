import React, { PropsWithChildren, useEffect, useState } from 'react';
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

import ToastAlertGroup from '@app/components/ToastAlertGroup';

import './index.css';

interface Props {
  title: string;
  loading?: boolean;
  error?: Error | undefined | boolean;
  alerts?: alertList;
}

const PageBasic: React.FC<PropsWithChildren<Props>> = ({ alerts, loading, error, title, children }) => {
  const [alertList, setAlertList] = useState<alertList>([]);

  // handle alert
  useEffect(() => {
    if (alerts) {
      setAlertList(alerts);
    }
  }, [alerts]);

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

  // close an alert
  const handleCloseAlert = (key: string) => {
    setAlertList(alertList.filter((e) => e.key !== key));
  };

  return (
    <PageSection variant={PageSectionVariants.light}>
      <ToastAlertGroup alerts={alertList} handleCloseAlert={handleCloseAlert} />
      <Title headingLevel="h1" size="lg">
        {title}
      </Title>
      <div className="content">{children}</div>
    </PageSection>
  );
};

export default PageBasic;
