// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { cssVar, type CssVars } from '@app/const/themeTokens';
import type { PromoterEntry } from './haStatus';

/** The active node's link sits on the peach tag: dark in every state rather
 *  than the shared Link's blue. */
export const ACTIVE_NODE_LINK_STYLE: CssVars = {
  '--link-text': cssVar('text/on-brand'),
  '--link-text-hover': cssVar('text/on-brand'),
  '--link-text-active': cssVar('text/on-brand'),
};

/** The promoter tree is wider than a tooltip's default maximum. */
export const PROMOTER_TOOLTIP_STYLES = {
  root: { maxWidth: 'none' },
  container: { width: 'max-content', maxWidth: 'none', padding: 12 },
};

const getServiceStatusColor = (status?: string) => {
  if (status === 'active' || status === 'running') {
    return cssVar('status/success');
  }

  if (status === 'failed') {
    return cssVar('status/error');
  }

  return cssVar('icon/muted');
};

export const renderPromoterTree = (
  promoter: PromoterEntry,
  resourceName: string,
  activeNodeLabel: string,
  titleNodeLabel?: string,
) => {
  const symbol = promoter.status === 'active' ? '●' : '○';
  const symbolColor = getServiceStatusColor(promoter.status);
  const dependencies = promoter.dependencies ?? [];

  return (
    <div className="text-[12px] min-w-[520px] overflow-x-auto font-[monospace] whitespace-nowrap">
      <div className="mb-1 font-[inherit]">
        Promoter: Resource {resourceName} currently {promoter.status} on {titleNodeLabel ?? activeNodeLabel}
      </div>
      {promoter.target ? (
        <div className="font-[inherit]">
          <span style={{ color: symbolColor }}>{symbol}</span> {promoter.target.name}{' '}
          <span style={{ color: getServiceStatusColor(promoter.target.status) }}>({promoter.target.status})</span>
        </div>
      ) : null}
      {dependencies.map((dep, index) => {
        const branch = index === dependencies.length - 1 ? '└─' : '├─';

        return (
          <div key={dep.name} className="pl-3.5 font-[inherit]">
            <span style={{ color: symbolColor }}>{symbol}</span> {branch} {dep.name}{' '}
            <span style={{ color: getServiceStatusColor(dep.status) }}>({dep.status})</span>
          </div>
        );
      })}
    </div>
  );
};
