// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Link } from '@app/components/Link';
import { SupportStatus } from '@app/components/SupportStatus';
import {
  getControllerConfig,
  getControllerProperties,
  getControllerVersion,
  useControllerHa,
  useNodes,
} from '@app/features/node';

const Tile: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode }> = ({ label, value, sub }) => (
  <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-(--border-subtle) p-4">
    <span className="text-[13px] font-medium text-(--text-secondary)">{label}</span>
    <span className="text-xl font-semibold break-words">{value}</span>
    {sub && <span className="text-[13px] text-(--text-secondary)">{sub}</span>}
  </div>
);

const yes = (value?: string) => value?.toLowerCase() === 'true';

/** The running controller at a glance: what it is, where it runs, what it serves and how it is reached. */
export const ControllerOverview: React.FC = () => {
  const { t } = useTranslation(['controller', 'common']);

  const { data: version } = useQuery({ queryKey: ['linstorVersion'], queryFn: getControllerVersion });
  const { data: config } = useQuery({ queryKey: ['getControllerConfig'], queryFn: getControllerConfig });
  const { data: properties } = useQuery({ queryKey: ['controllerProperties'], queryFn: getControllerProperties });
  const { data: nodes } = useNodes({});
  const ha = useControllerHa();

  const v = version?.data;
  const c = config?.data;
  const props = (properties?.data ?? {}) as Record<string, string>;

  const satellites = (nodes ?? []).filter((n) => n.type?.toUpperCase() !== 'CONTROLLER');
  const online = satellites.filter((n) => n.connection_status === 'ONLINE' || n.connection_status === 'CONNECTED');

  const built = v?.build_time ? new Date(v.build_time).toISOString().slice(0, 10) : undefined;

  return (
    <section aria-label={t('controller:overview')} className="mb-6 flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Tile
          label={t('controller:version')}
          value={v?.version ?? '-'}
          sub={[
            v?.rest_api_version && t('controller:rest_api_version', { version: v.rest_api_version }),
            built && t('controller:built', { date: built }),
          ]
            .filter(Boolean)
            .join(' · ')}
        />

        <Tile
          label={t('controller:high_availability')}
          value={
            // Nothing to say until LINSTOR has been asked: "single" would be a guess.
            ha.isPending ? (
              '-'
            ) : ha.enabled ? (
              <span className="inline-flex items-center gap-2">
                <SupportStatus supported={!!ha.active} />
                {ha.active ? t('controller:active_on', { node: ha.active }) : t('controller:no_active_node')}
              </span>
            ) : (
              t('controller:single_controller')
            )
          }
          sub={
            ha.isPending
              ? undefined
              : ha.enabled
                ? [
                    ha.standby.length > 0 && t('controller:standby', { nodes: ha.standby.join(', ') }),
                    ha.vip && t('controller:vip', { ip: ha.vip }),
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : t('controller:not_highly_available')
          }
        />

        <Tile
          label={t('controller:satellites')}
          value={t('controller:satellites_online', { online: online.length, total: satellites.length })}
          sub={<Link to="/inventory/nodes">{t('controller:open_node_list')}</Link>}
        />

        <Tile
          label={t('controller:rest_api')}
          value={c?.https?.enabled ? `HTTPS :${c.https.port}` : c?.http?.enabled ? `HTTP :${c.http.port}` : '-'}
          sub={[
            c?.https?.enabled && c?.http?.enabled && `HTTP :${c.http.port}`,
            yes(props['REST/AutoHTTPS']) && t('controller:auto_https'),
          ]
            .filter(Boolean)
            .join(' · ')}
        />

        <Tile
          label={t('controller:access')}
          value={
            yes(props['Auth/TokenAuthenticationEnabled'])
              ? t('controller:token_auth_on')
              : t('controller:token_auth_off')
          }
          sub={
            <>
              {c?.ldap?.enabled ? t('controller:ldap_on') : t('controller:ldap_off')}
              {' · '}
              <Link to="/auth-tokens">{t('controller:manage_tokens')}</Link>
            </>
          }
        />
      </div>

      <dl className="m-0 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-6 gap-y-2 rounded-lg border border-(--border-subtle) p-4 text-sm">
        <dt className="font-medium text-(--text-secondary)">{t('controller:logs')}</dt>
        <dd className="m-0 font-mono break-all">
          {[c?.log?.directory, c?.log?.level].filter(Boolean).join(' · ') || '-'}
        </dd>
      </dl>
    </section>
  );
};
