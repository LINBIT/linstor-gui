import 'whatwg-fetch';

import createClient from 'openapi-fetch';
import { paths } from '@app/apis/schema';

const { get } = createClient<paths>({ baseUrl: '' });

// storage pool
const getPhysicalStoragePoolByNode = ({ node }) =>
  get('/v1/physical-storage/{node}', {
    params: {
      path: {
        node,
      },
    },
  });

export { getPhysicalStoragePoolByNode };
