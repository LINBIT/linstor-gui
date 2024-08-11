import { get, post, del } from '../requests';
import { S3RemoteCreateRequestBody, LINSTORRemoteCreateRequestBody } from './types';

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

export { getRemoteList, createS3Remote, createLINSTORRemote, deleteRemote };
