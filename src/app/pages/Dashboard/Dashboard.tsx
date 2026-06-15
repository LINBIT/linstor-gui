// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { StoragePoolInfo } from '@app/components/StoragePoolInfo';
import { FaultyList } from '@app/features/resource';
import { SetupClusterCard, SetupClusterWizard, useClusterEmpty } from '@app/features/clusterSetup';

const Dashboard: React.FunctionComponent = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { empty, dismissed, isFetched, dismiss, refetch } = useClusterEmpty();
  const [wizardOpen, setWizardOpen] = useState(false);

  // Don't flash either layout before the node count resolves.
  if (!isFetched) {
    return <PageBasic title={t('dashboard:title')} />;
  }

  const showSetup = empty && !dismissed;

  return (
    <PageBasic title={t('dashboard:title')}>
      {showSetup ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <SetupClusterCard onStart={() => setWizardOpen(true)} onDismiss={dismiss} />
          </div>
          <SetupClusterWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onCompleted={() => refetch()} />
        </>
      ) : (
        <>
          <StoragePoolInfo />
          <FaultyList />
        </>
      )}
    </PageBasic>
  );
};

export default Dashboard;
