// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { components } from '@app/apis/schema';

export type RemoteList = components['schemas']['RemoteList'][];
export type S3RemoteCreateRequestBody = components['schemas']['S3Remote'];
export type LINSTORRemoteCreateRequestBody = components['schemas']['LinstorRemote'];
export type RemoteBackupCreateRequestBody = components['schemas']['BackupCreate'];

export type ScheduleList = components['schemas']['ScheduleList'];
export type ScheduleCreateRequest = components['schemas']['Schedule'];
export type ScheduleModifyRequest = components['schemas']['ScheduleModify'];
export type BackupSchedule = components['schemas']['BackupSchedule'];
export type ScheduleByResource = components['schemas']['ScheduledRscs'];

export type ScheduleDetails = components['schemas']['ScheduleDetails'];

export type BackupDeleteQuery = {
  /** @description ID of the specific backup to be deleted */
  id?: string;
  /** @description ID prefix of possibly multiple backups to be deleted */
  id_prefix?: string;
  /** @description deletes the specified backup(s) and all backups depending on it */
  cascading?: boolean;
  /** @description deletes all backups that were made before the given timestamp */
  timestamp?: string;
  /** @description deletes all backups made from the specified resource */
  resource_name?: string;
  /** @description deletes all backups made from the specified node */
  node_name?: string;
  /** @description deletes all backups made from the current cluster */
  all_local_cluster?: boolean;
  /** @description deletes ALL backups */
  all?: boolean;
  /** @description deletes the backup associated with the s3key if it fits the naming-criteria */
  s3key?: string;
  /** @description deletes the s3key - regardless of whether it is a backup or not */
  s3key_force?: string;
  /** @description does not delete anything but returns an ApiCallRc with all entries that would be deleted */
  dryrun?: boolean;
  /** @description makes sure the snapshots the backups originated from are not deleted */
  keep_snaps?: boolean;
};
