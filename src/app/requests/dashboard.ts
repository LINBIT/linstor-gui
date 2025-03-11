// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import service from '@app/requests';

export const fetchMetrics = async (): Promise<string> => {
  try {
    const res = await service.get('/metrics', {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    if (res.data) {
      return res.data;
    } else {
      throw new Error(res.status + ' Failed Fetch ');
    }
  } catch (e) {
    throw new Error(e + ' Failed Fetch!!! ');
  }
};

export async function resourcesList() {
  return (await service.get('/v1/view/resources')).data;
}

export async function resourcesDetailList() {
  return Array.from(await resourcesList())
    .map((it: any) => {
      let failStr = 'OK';
      let stateStr;
      {
        const conn = it?.layer_object?.drbd?.connections || {};
        let count = 0;
        let fail = false;
        for (const nodeName in conn) {
          count++;
          if (!(conn[nodeName]?.connected || false)) {
            fail = true;
            if (failStr !== '') {
              failStr += ',';
            }
            failStr += `${nodeName} ${conn[nodeName].message}`;
          }
        }
        fail = count === 0 ? true : fail;
        failStr = fail ? failStr : 'OK';
      }

      const flags = it.flags || [];

      if (flags.includes('DELETE')) {
        stateStr = 'DELETING';
      } else if (flags.includes('INACTIVE')) {
        stateStr = 'INACTIVE';
      } else if (it.state?.in_use) {
        stateStr = 'InUse';
      } else {
        stateStr = 'Unused';
        const disk_state = it?.volumes?.[0]?.state?.disk_state || '';
        if (disk_state === 'Diskless') {
          if (flags.includes('TIE_BREAKER')) {
            return null;
          }
          stateStr = disk_state;
        } else if (disk_state !== '') {
          stateStr = disk_state;
        }
      }
      return {
        name: it.name,
        node: it.node_name,
        port: it?.layer_object?.drbd?.drbd_resource_definition?.port || '',
        usage: it?.state?.in_use ? 'InUse' : 'Unused',
        conns: failStr,
        state: stateStr,
        created_on: it.create_timestamp,
        props: it.props,
        all_data: it,
      };
    })
    .filter((el) => el !== null);
}
