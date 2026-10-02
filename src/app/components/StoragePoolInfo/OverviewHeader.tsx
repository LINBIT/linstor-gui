// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MAX_NODES_TO_RENDER } from './constants';

type OverviewHeaderProps = {
  /** Nodes the chart shows. */
  nodeCount: number;
  /** Nodes with storage pools, shown or not. */
  totalNodeCount: number;
};

/** The title, with a hint that only the nodes with the most capacity are drawn. */
export const OverviewHeader = ({ nodeCount, totalNodeCount }: OverviewHeaderProps) => {
  const { t } = useTranslation();
  const isTruncated = totalNodeCount > nodeCount;

  return (
    <div className="m-0 mb-4 flex items-baseline gap-3 flex-wrap">
      <h2 className="m-0 text-[26px] font-semibold">{t('common:storage_pool_overview')}</h2>
      <Tooltip
        title={
          isTruncated
            ? `${t('common:showing_top_n_of_total_nodes', {
                n: nodeCount,
                total: totalNodeCount,
              })}. ${t('common:top_n_nodes_hint', { n: MAX_NODES_TO_RENDER })}`
            : t('common:top_n_nodes_hint', { n: MAX_NODES_TO_RENDER })
        }
        placement="right"
      >
        <span className="inline-flex text-(--icon-muted) hover:text-(--icon-default) cursor-help text-base">
          <InfoCircleOutlined />
        </span>
      </Tooltip>
    </div>
  );
};
