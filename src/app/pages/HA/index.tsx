// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Alert, Tooltip } from 'antd';

import PageBasic from '@app/components/PageBasic';
import { Button } from '@app/components/Button';
import { List, useReactorInstallation } from '@app/features/ha';
import { useLinstorVersion, MIN_API_VERSION } from '@app/hooks';

const HA = () => {
  const { t } = useTranslation(['ha', 'common']);
  const navigate = useNavigate();
  const { isFetched: versionFetched, hasMinVersion } = useLinstorVersion();
  // A config would run nowhere without drbd-reactor on any node.
  const { installedNowhere } = useReactorInstallation();

  if (versionFetched && !hasMinVersion(MIN_API_VERSION.HA)) {
    return (
      <PageBasic title={t('ha:list')}>
        <Alert
          type="warning"
          showIcon
          title={t('common:feature_unavailable')}
          description={t('common:feature_requires_api_version', { version: MIN_API_VERSION.HA })}
        />
      </PageBasic>
    );
  }

  return (
    <PageBasic
      title={t('ha:list')}
      extra={
        <Tooltip title={installedNowhere ? t('ha:create_needs_reactor') : ''}>
          {/* A DOM element for the tooltip to attach to (the button can be disabled). */}
          <span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={installedNowhere}
              onClick={() => navigate('/reactor/create')}
            >
              {t('common:create')}
            </Button>
          </span>
        </Tooltip>
      }
    >
      <List />
    </PageBasic>
  );
};

export default HA;
