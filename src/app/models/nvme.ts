import { NVME } from '@app/interfaces/nvme';
import service from '@app/requests';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

import { notify } from '@app/utils/toast';

type Data = {
  total: number;
  list: NVME[];
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

export const nvme = createModel<RootModel>()({
  state: {
    total: 0,
    list: [],
  } as Data, // initial state
  reducers: {
    // handle state changes with pure functions
    setNvmeList(state, payload: Data) {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: (dispatch) => ({
    // getNvmeList
    async getList(payload: any, state) {
      const res = await service.get('/api/v2/nvme-of');
      const data = res.data ?? [];

      // TODO: handle volumes
      const iscsiList = [];

      for (const item of data) {
        for (const volume of item.volumes) {
          iscsiList.push({ ...item, LUN: volume.number });
        }
      }

      dispatch.nvme.setNvmeList({
        total: data.length,
        list: data,
      });
    },
    // Create iSCSI
    async createNvme(payload: CreateDataType, state) {
      try {
        const res = await service.post('/api/v2/nvme-of', {
          ...payload,
        });
        if (res.status === 201) {
          notify('Created iSCSI successfully', {
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
    // Delete Nvme
    async deleteNvme(payload: string, state) {
      try {
        dispatch.nvme.setNvmeList({
          total: state.nvme.total - 1,
          list: state.nvme.list.map((item) => {
            if (item.nqn === payload) {
              return {
                ...item,
                deleting: true,
              };
            }
            return item;
          }),
        });
        const res = await service.delete(`/api/v2/nvme-of/${payload}`);

        if (res.status === 200) {
          notify('Deleted Successfully', {
            type: 'success',
          });
          dispatch.nvme.getList({});
        }
      } catch (error) {
        console.log(error, 'error');
        notify(String(error.message), {
          type: 'error',
        });
      }
    },
    // start Nvme
    async startNvme(payload: string, state) {
      try {
        dispatch.nvme.setNvmeList({
          total: state.nvme.total,
          list: state.nvme.list.map((item) => {
            if (item.nqn === payload) {
              return {
                ...item,
                starting: true,
              };
            }
            return item;
          }),
        });
        const res = await service.post(`/api/v2/nvme-of/${payload}/start`);

        if (res.status === 200) {
          notify('Started Successfully', {
            type: 'success',
          });
          dispatch.nvme.getList({});
        }
      } catch (error) {
        console.log(error, 'error');
        notify(String(error.message), {
          type: 'error',
        });
      }
    },
    // stop Nvme
    async stopNvme(payload: string, state) {
      try {
        dispatch.nvme.setNvmeList({
          total: state.nvme.total,
          list: state.nvme.list.map((item) => {
            if (item.nqn === payload) {
              return {
                ...item,
                stopping: true,
              };
            }
            return item;
          }),
        });
        const res = await service.post(`/api/v2/nvme-of/${payload}/stop`);

        if (res.status === 200) {
          notify('Stopped Successfully', {
            type: 'success',
          });
          dispatch.nvme.getList({});
        }
      } catch (error) {
        console.log(error, 'error');
        notify(String(error.message), {
          type: 'error',
        });
      }
    },
    // Add LUN
    async addLUN(payload: { iqn: string; LUN: number; size_kib: number }) {
      try {
        const res = await service.put(`/api/v2/nvme-of/${payload.iqn}/${payload.LUN}`, {
          size_kib: payload.size_kib,
          number: payload.LUN,
        });

        if (res.status === 200) {
          notify('Added Successfully', {
            type: 'success',
          });
          dispatch.nvme.getList({});
        }
      } catch (error) {
        console.log(error, 'error');
        notify(String(error.message), {
          type: 'error',
        });
      }
    },
    // Delete LUN
    async deleteLUN(payload: Array<string | number>) {
      try {
        const res = await service.delete(`/api/v2/nvme-of/${payload[0]}/${payload[1]}`);

        if (res.status === 200) {
          notify('Deleted Successfully', {
            type: 'success',
          });
          dispatch.nvme.getList({});
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
