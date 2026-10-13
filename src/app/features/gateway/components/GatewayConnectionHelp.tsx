// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Alert } from 'antd';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Link } from '@app/components/Link';
import { gatewayStatusUrl, isMixedContent } from '../connection';

interface GatewayConnectionHelpProps {
  /** The gateway URL the requests went to. */
  host: string;
  /** Link to the Gateway settings (from the gateway lists). */
  showSettingsLink?: boolean;
}

/**
 * The gateway could not be reached. The browser reports a rejected CORS
 * origin, an untrusted certificate and a closed port alike ("Failed to
 * fetch"), so this lists what to check rather than guessing which it was.
 */
export const GatewayConnectionHelp: React.FC<GatewayConnectionHelpProps> = ({ host, showSettingsLink }) => {
  const { t } = useTranslation('settings');
  const { pathname } = useLocation();
  const settingsPath = `${pathname.startsWith('/hci/') ? '/hci' : ''}/settings`;
  const statusUrl = gatewayStatusUrl(host);

  return (
    <Alert
      type="warning"
      showIcon
      title={t('gateway_unreachable', { host })}
      description={
        <>
          <ul className="m-0 mt-1 flex list-disc flex-col gap-1 pl-5">
            {isMixedContent(host) && <li>{t('gateway_check_mixed_content')}</li>}
            {/^https:\/\//i.test(host.trim()) && (
              <li>
                {t('gateway_check_certificate')}{' '}
                <a href={statusUrl} target="_blank" rel="noreferrer" className="break-all">
                  {statusUrl}
                </a>
              </li>
            )}
            <li>
              {t('gateway_check_cors')} <code className="break-all">{window.location.origin}</code>
            </li>
            <li>{t('gateway_check_running')}</li>
          </ul>
          {showSettingsLink && (
            <div className="mt-2">
              {/* In the state, not the query string: AppLayout drops the query on navigation. */}
              <Link to={settingsPath} state={{ tab: 'gateway' }}>
                {t('gateway_open_settings')}
              </Link>
            </div>
          )}
        </>
      }
    />
  );
};
