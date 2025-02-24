// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Button, Table } from 'antd';
import type { TableProps } from 'antd';
import get from 'lodash.get';
import { useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';

import { formatTime } from '@app/utils/time';
import { getResources } from '../api';
import { ResourceDataType } from '../types';

const Content = styled.div`
  margin-top: 20px;
`;

interface Resource {
  name: string;
  node_name: string;
  flags?: string[];
  state?: {
    in_use?: boolean;
  };
  volumes?: Array<{
    state?: {
      disk_state?: string;
    };
  }>;
  layer_object?: {
    drbd_resource?: {
      connections?: {
        [key: string]: {
          connected: boolean;
          message: string;
        };
      };
    };
  };
}

export enum ResourceState {
  UNKNOWN = 'Unknown',
  DELETING = 'DELETING',
  INACTIVE = 'INACTIVE',
  UP_TO_DATE = 'UpToDate',
  DISKLESS = 'Diskless',
}

function isFaultyResource(resource: Resource): boolean {
  let state = ResourceState.UNKNOWN;

  if (resource.flags?.some((flag) => ['DELETE', 'DRBD_DELETE'].includes(flag))) {
    state = ResourceState.DELETING;
    return true;
  }

  if (resource.flags?.includes('RSC_INACTIVE')) {
    state = ResourceState.INACTIVE;
    return true;
  }

  if (resource.volumes?.length) {
    for (const volume of resource.volumes) {
      const diskState = volume.state?.disk_state;

      if (!diskState || diskState === 'Unknown' || diskState === 'DUnknown') {
        return true;
      }

      if (
        diskState === 'Diskless' &&
        !resource.flags?.includes('DISKLESS') &&
        !resource.flags?.includes('TIE_BREAKER')
      ) {
        return true;
      }

      if (['Inconsistent', 'Failed'].includes(diskState)) {
        return true;
      }
    }
  }

  if (resource.flags?.includes('EVACUATE')) {
    return true;
  }

  const connections = resource.layer_object?.drbd_resource?.connections;
  if (connections) {
    for (const [_, conn] of Object.entries(connections)) {
      if (!conn.connected) {
        return true;
      }
    }
  }

  if (state === ResourceState.UNKNOWN) {
    return true;
  }

  return false;
}

function getFaultyResources(resources: Resource[]): Resource[] {
  return resources.filter(isFaultyResource);
}

export const FaultyList = () => {
  const { t } = useTranslation(['common', 'resource']);

  const history = useHistory();

  const { data: resources, isLoading } = useQuery({
    queryKey: ['getResources'],
    queryFn: async () => {
      const all = await getResources();
      const faulty = getFaultyResources(all?.data ?? ([] as any));

      console.log('faulty', faulty);

      return faulty;
    },
  });

  console.log('resources', resources);

  const getVolumeCellState = (
    vlm_state: { disk_state: string },
    rsc_flags: string | string[],
    vlm_flags: string | string[],
  ) => {
    const state_prefix = vlm_flags.indexOf('RESIZE') > -1 ? 'Resizing, ' : '';
    let state = state_prefix + 'Unknown';
    if (vlm_state && vlm_state.disk_state) {
      const disk_state = vlm_state.disk_state;
      if (disk_state == 'DUnknown') {
        state = state_prefix + 'Unknown';
      } else if (disk_state == 'Diskless') {
        if (!rsc_flags.includes('DISKLESS')) {
          state = state_prefix + disk_state;
        } else if (rsc_flags.includes('TIE_BREAKER')) {
          state = 'TieBreaker';
        } else {
          state = state_prefix + disk_state;
        }
      } else {
        state = state_prefix + disk_state;
      }
    }
    return state;
  };

  const handleResourceStateDisplay = (resourceItem: ResourceDataType) => {
    let stateStr = 'Unknown';
    const flags = resourceItem.flags || [];
    const rsc_state_obj = resourceItem.state || {};
    const volumes = resourceItem.volumes || [];

    if (flags.includes('DELETE')) {
      stateStr = 'DELETING';
    } else if (flags.includes('INACTIVE')) {
      stateStr = 'INACTIVE';
    } else if (rsc_state_obj) {
      if (typeof rsc_state_obj.in_use !== 'undefined') {
        for (let i = 0; i < volumes.length; ++i) {
          const volume = volumes[i];
          const vlm_state = volume.state || {};
          const vlm_flags = volume.flags || [];
          stateStr = getVolumeCellState(vlm_state as any, flags, vlm_flags);

          if (flags.includes('EVACUATE')) {
            stateStr += ', Evacuating';
          }
        }
      }
    }

    return stateStr;
  };

  const handleConnectStatusDisplay = (resourceItem: ResourceDataType) => {
    let failStr = '';
    const conn = get(resourceItem, 'layer_object.drbd.connections', {}) as any;
    if (Object.keys(conn).length === 0) {
      return 'OK';
    }
    let count = 0;
    let fail = false;
    for (const nodeName in conn) {
      count++;
      if (!conn[nodeName].connected) {
        fail = true;
        if (failStr !== '') {
          failStr += ',';
        }
        failStr += `${nodeName} ${conn[nodeName].message}`;
      }
    }
    fail = count === 0 ? true : fail;
    failStr = fail ? failStr : 'OK';
    return failStr;
  };

  const columns: TableProps<ResourceDataType>['columns'] = [
    {
      title: t('common:name'),
      key: 'name',
      dataIndex: 'name',
      render: (item) => {
        return (
          <Button
            type="link"
            onClick={() => {
              history.push(`/storage-configuration/resource-overview?resource=${item}`);
            }}
          >
            {item}
          </Button>
        );
      },
    },
    {
      title: t('common:node'),
      key: 'node_name',
      dataIndex: 'node_name',
      render: (node_name) => {
        return (
          <Button
            type="link"
            onClick={() => {
              history.push(`/inventory/nodes/${node_name}`);
            }}
          >
            {node_name}
          </Button>
        );
      },
    },
    {
      title: t('common:created_on'),
      key: 'create_timestamp',
      dataIndex: 'create_timestamp',
      render: (create_timestamp) => {
        return <span>{formatTime(create_timestamp)}</span>;
      },
    },
    {
      title: t('common:port'),
      key: 'port',
      render: (item) => {
        return <span>{get(item, 'layer_object.drbd.drbd_resource_definition.port')}</span>;
      },
    },
    {
      title: t('common:usage_status'),
      key: 'in_use',
      dataIndex: 'in_use',
      align: 'center',
      render: (_, item) => {
        const in_use = item.state?.in_use;
        const usage = in_use ? 'InUse' : 'Unused';
        return (
          <span>
            {in_use ? (
              <CheckCircleFilled style={{ color: 'green', fontSize: '16px' }} />
            ) : (
              <CloseCircleFilled style={{ color: 'grey', fontSize: '16px' }} />
            )}
            <span style={{ marginLeft: 8 }}>{usage}</span>
          </span>
        );
      },
    },
    {
      title: t('common:connection_status'),
      key: 'connection_status',
      align: 'center',
      render: (_, item) => {
        return <span>{handleConnectStatusDisplay(item)}</span>;
      },
    },
    {
      title: t('common:state'),
      key: 'state',
      align: 'center',
      render: (_, item) => {
        return <span>{handleResourceStateDisplay(item)}</span>;
      },
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Content>
      <h3>{t('common:faulty_resource')}</h3>
      {resources ? (
        <Table columns={columns as any} dataSource={resources ?? []} pagination={false} />
      ) : (
        <div>{t('common:all_resources_are_healthy')}</div>
      )}
    </Content>
  );
};
