// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { get, post, del, put } from '../requests';
import { ScheduleCreateRequest, ScheduleModifyRequest, BackupSchedule } from './types';

const getScheduleList = () => {
  return get('/v1/schedules');
};

const createSchedule = (data: ScheduleCreateRequest) => {
  return post('/v1/schedules', {
    body: data,
  });
};

const modifySchedule = (scheduleName: string, body: ScheduleModifyRequest) => {
  return put('/v1/schedules/{scheduleName}', {
    params: {
      path: {
        scheduleName,
      },
    },
    body,
  });
};

const deleteSchedule = (scheduleName: string) => {
  return del('/v1/schedules/{scheduleName}', {
    params: {
      path: {
        scheduleName,
      },
    },
  });
};

const enableSchedule = (remote_name: string, schedule_name: string, body: BackupSchedule) => {
  return put('/v1/remotes/{remote_name}/backups/schedule/{schedule_name}/enable', {
    params: {
      path: {
        remote_name,
        schedule_name,
      },
    },
    body,
  });
};

const disableSchedule = (remote_name: string, schedule_name: string, body?: BackupSchedule) => {
  return put('/v1/remotes/{remote_name}/backups/schedule/{schedule_name}/disable', {
    params: {
      path: {
        remote_name,
        schedule_name,
      },
    },
    body,
  });
};

const deleteBackupSchedule = (
  remote_name: string,
  schedule_name: string,
  query: {
    rsc_dfn_name?: string;
  },
) => {
  return del('/v1/remotes/{remote_name}/backups/schedule/{schedule_name}/delete', {
    params: {
      path: {
        remote_name,
        schedule_name,
      },
      query,
    },
  });
};

const getScheduleByResource = (query: {
  rsc?: string;
  remote?: string;
  schedule?: string;
  'active-only'?: boolean;
}) => {
  return get('/v1/view/schedules-by-resource', {
    params: {
      query: {
        ...query,
      },
    },
  });
};

export {
  getScheduleList,
  createSchedule,
  modifySchedule,
  deleteSchedule,
  enableSchedule,
  disableSchedule,
  deleteBackupSchedule,
  getScheduleByResource,
};
