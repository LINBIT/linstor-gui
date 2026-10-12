// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Select } from '@app/components/Select';
import { getControllerConfig, updateControllerLogLevel } from '@app/features/node';

const LOG_LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

/** The controller's log level, changed while it runs. */
export const ControllerActions: React.FC = () => {
  const { t } = useTranslation(['controller', 'common']);
  const queryClient = useQueryClient();

  const { data: config } = useQuery({ queryKey: ['getControllerConfig'], queryFn: getControllerConfig });

  const logLevel = useMutation({
    mutationFn: (level: LogLevel) => updateControllerLogLevel(level),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['getControllerConfig'] }),
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="controller-log-level" className="text-sm font-medium text-(--text-secondary)">
        {t('controller:log_level')}
      </label>
      <Select
        id="controller-log-level"
        className="w-28"
        value={config?.data?.log?.level}
        loading={logLevel.isPending}
        onChange={(level) => logLevel.mutate(level as LogLevel)}
        options={LOG_LEVELS.map((level) => ({ label: level, value: level }))}
      />
    </div>
  );
};
