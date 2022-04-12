import { ISCSI } from '@app/interfaces/iscsi';
import service from '@app/requests';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

import { notify } from '@app/utils/toast';

type Data = {
  total: number;
  list: ISCSI[];
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
    setISCSIList(state, payload: Data) {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: (dispatch) => ({
    // getISCSIList
    async getList(payload: any, state) {
      const res = await service.get('/api/v2/nfs');
      const data = res.data ?? [];
      console.log(res.data, '???');

      // TODO: handle volumes
      const iscsiList = [];

      for (const item of data) {
        for (const volume of item.volumes) {
          iscsiList.push({ ...item, LUN: volume.number });
        }
      }

      dispatch.nfs.setISCSIList({
        total: data.length,
        list: data,
      });
    },
    // Create iSCSI
    async createISCSI(payload: CreateDataType, state) {
      try {
        const res = await service.post('/api/v2/nfs', {
          ...payload,
        });
        console.log(res, 'res');
      } catch (error) {
        console.log(error, 'error');
        notify(String(error.message), {
          type: 'error',
        });
      }
    },
    // Delete ISCSI
    async deleteISCSI(payload: string, state) {
      try {
        const res = await service.delete(`/api/v2/nfs/${payload}`);
        console.log(res, 'res');
      } catch (error) {
        console.log(error, 'error');
        notify(String(error.message), {
          type: 'error',
        });
      }
    },
    // start ISCSI
    async startISCSI(payload: string, state) {
      try {
        const res = await service.post(`/api/v2/nfs/${payload}/start`);
        console.log(res, 'res');
      } catch (error) {
        console.log(error, 'error');
        notify(String(error.message), {
          type: 'error',
        });
      }
    },
    // stop ISCSI
    async stopISCSI(payload: string, state) {
      try {
        const res = await service.post(`/api/v2/nfs/${payload}/stop`);
        console.log(res, 'res');
      } catch (error) {
        console.log(error, 'error');
        notify(String(error.message), {
          type: 'error',
        });
      }
    },
  }),
});
