import { NFS } from '@app/interfaces/nfs';
import service from '@app/requests';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

import { notify } from '@app/utils/toast';

type Data = {
  total: number;
  list: NFS[];
};

type VolumeType = {
  number: number;
  size_kib: number;
};

type CreateDataType = {
  iqn: string;
  resource_group: string;
  volumes: VolumeType[];
  service_ips: string[];
};

export const nfs = createModel<RootModel>()({
  state: {
    total: 0,
    list: [],
  } as Data, // initial state
  reducers: {
    // handle state changes with pure functions
    setNFSList(state, payload: Data) {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: (dispatch) => ({
    // getNFSList
    async getList(payload: any, state) {
      const res = await service.get('/api/v2/nfs');
      const data = res.data ?? [];

      dispatch.nfs.setNFSList({
        total: data.length,
        list: data,
      });
    },
    // Create NFS
    async createNFS(payload: CreateDataType, state) {
      try {
        const res = await service.post('/api/v2/nfs', {
          ...payload,
        });
        if (res.status === 201) {
          notify('Created NFS successfully', {
            type: 'success',
          });
          return true;
        }
      } catch (error) {
        console.log(error, 'error');
        notify(String(error.message), {
          type: 'error',
        });
      }
    },
    // Delete NFS
    async deleteNFS(payload: string, state) {
      try {
        dispatch.nfs.setNFSList({
          total: state.nfs.total - 1,
          list: state.nfs.list.map((item) => {
            if (item.name === payload) {
              return {
                ...item,
                deleting: true,
              };
            }
            return item;
          }),
        });
        const res = await service.delete(`/api/v2/nfs/${payload}`);

        if (res.status === 200) {
          notify('Deleted Successfully', {
            type: 'success',
          });
          dispatch.nfs.getList({});
        }
      } catch (error) {
        console.log(error, 'error');
        notify(String(error.message), {
          type: 'error',
        });
      }
    },
    // start NFS
    async startNFS(payload: string, state) {
      try {
        dispatch.nfs.setNFSList({
          total: state.nfs.total,
          list: state.nfs.list.map((item) => {
            if (item.name === payload) {
              return {
                ...item,
                starting: true,
              };
            }
            return item;
          }),
        });
        const res = await service.post(`/api/v2/nfs/${payload}/start`);

        if (res.status === 200) {
          notify('Started Successfully', {
            type: 'success',
          });
          dispatch.nfs.getList({});
        }
      } catch (error) {
        console.log(error, 'error');
        notify(String(error.message), {
          type: 'error',
        });
      }
    },
    // stop NFS
    async stopNFS(payload: string, state) {
      try {
        dispatch.nfs.setNFSList({
          total: state.nfs.total,
          list: state.nfs.list.map((item) => {
            if (item.name === payload) {
              return {
                ...item,
                stopping: true,
              };
            }
            return item;
          }),
        });
        const res = await service.post(`/api/v2/nfs/${payload}/stop`);

        if (res.status === 200) {
          notify('Stopped Successfully', {
            type: 'success',
          });
          dispatch.nfs.getList({});
        }
      } catch (error) {
        console.log(error, 'error');
        notify(String(error.message), {
          type: 'error',
        });
      }
    },
  }),
});
