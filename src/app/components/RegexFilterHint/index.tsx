// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { useLinstorVersion, MIN_API_VERSION } from '@app/hooks';

/**
 * Info tooltip shown next to list search fields when the controller supports
 * regex list filtering (linstor-server >= 1.34.0 / rest_api_version >= 1.28.0).
 * The list endpoints match the given names as case-insensitive Java regular
 * expressions, so the search value is passed straight through. Renders nothing
 * on older controllers, where the same fields do plain name matching.
 *
 * Intended to be used as the `suffix` of a search `Input`.
 */
export const RegexFilterHint: React.FC = () => {
  const { t } = useTranslation('common');
  const { hasMinVersion } = useLinstorVersion();

  if (!hasMinVersion(MIN_API_VERSION.REGEX_FILTER)) {
    return null;
  }

  return (
    <Tooltip title={t('regex_filter_hint')}>
      <QuestionCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
    </Tooltip>
  );
};

export default RegexFilterHint;
