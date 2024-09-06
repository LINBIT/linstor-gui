// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { PropsWithChildren } from 'react';
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
import { Button } from 'antd';

import { MainContent, SectionHead } from './styled';
import { useHistory } from 'react-router-dom';

interface Props {
  title: string;
  loading?: boolean;
  error?: Error | undefined | boolean;
  alerts?: alertList;
  showBack?: boolean;
}

const PageBasic: React.FC<PropsWithChildren<Props>> = ({ showBack, loading, error, title, children }) => {
  const history = useHistory();

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
      <SectionHead>
        <Title headingLevel="h1" size="lg">
          {title}
        </Title>

        {showBack && <Button onClick={() => history.goBack()}>&#8592;&nbsp;back</Button>}
      </SectionHead>

      <MainContent className="content">{children}</MainContent>
    </PageSection>
  );
};

export default PageBasic;
