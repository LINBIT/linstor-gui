import { get, post, del } from '../requests';
import {
  S3RemoteCreateRequestBody,
  LINSTORRemoteCreateRequestBody,
  RemoteBackupCreateRequestBody,
  BackupDeleteQuery,
} from './types';

const getRemoteList = () => {
  return get('/v1/remotes');
};

const deleteRemote = (remote_name: string) => {
  return del('/v1/remotes', {
    params: {
      query: {
        remote_name,
      },
    },
  });
};

const createS3Remote = (data: S3RemoteCreateRequestBody) => {
  return post('/v1/remotes/s3', {
    body: data,
  });
};

const createLINSTORRemote = (data: LINSTORRemoteCreateRequestBody) => {
  return post('/v1/remotes/linstor', {
    body: data,
  });
};

const createBackup = (remote_name: string, body: RemoteBackupCreateRequestBody) => {
  return post('/v1/remotes/{remote_name}/backups', {
    params: {
      path: {
        remote_name,
      },
    },
    body,
  });
};

const getBackup = (remote_name: string) => {
  return get('/v1/remotes/{remote_name}/backups', {
    params: {
      path: {
        remote_name,
      },
    },
  });
};

const deleteBackup = (remote_name: string, query?: BackupDeleteQuery) => {
  return del('/v1/remotes/{remote_name}/backups', {
    params: {
      path: {
        remote_name,
      },
      query,
    },
  });
};

export { getRemoteList, createS3Remote, createLINSTORRemote, deleteRemote, createBackup, getBackup, deleteBackup };
