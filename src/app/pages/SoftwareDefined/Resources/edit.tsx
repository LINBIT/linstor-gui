import React, { useEffect, FunctionComponent, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';
import ResourceForm from './components/ResourceForm';
import get from 'lodash.get';
import service from '@app/requests';

const ResourceEdit: FunctionComponent = () => {
  const { resource } = useParams() as { resource: string };
  const [alertList, setAlertList] = useState<alertList>([]);

  const {
    data: initialVal,
    loading,
    error,
  } = useRequest(`/v1/view/resources?resources=${resource}`, {
    requestMethod: (url) => {
      return service.get(url).then((res) => {
        const result = res.data || [];

        return {
          resource_definition_name: result[0]?.name,
          node: result[0]?.node_name,
          storage_pool: get(result?.[0], 'props.StorPoolName'),
          network_preference: get(result?.[0], 'props.PrefNic'),
        };
      });
    },
  });

  const { run: updateResource } = useRequest(
    (node, body) => {
      return {
        url: `/v1/resource-definitions/${resource}/resources/${node}`,
        body,
      };
    },
    {
      requestMethod: ({ url, body }) => {
        return service.put(url, body).then((res) => {
          if (res.data) {
            setAlertList(
              res.data.map((e) => ({
                variant: e.ret_code > 0 ? 'success' : 'danger',
                key: (e.ret_code + new Date()).toString(),
                title: e.message,
              }))
            );
          }
        });
      },
    }
  );

  const handleEditNode = async (data) => {
    //   {
    //     "resource_definition_name": "create",
    //     "node": "node101",
    //     "storage_pool": "MySP",
    //     "network_preference": "default"
    // }

    let updateData;

    if (data.network_preference !== '') {
      updateData = {
        override_props: { StorPoolName: data.storage_pool, PrefNic: data.network_preference },
        delete_props: [],
      };
    } else {
      updateData = { override_props: { StorPoolName: data.storage_pool }, delete_props: ['PrefNic'] };
    }

    console.log(data, 'data');

    await updateResource(data.node, updateData);
  };

  return (
    <PageBasic title="Edit Resource" loading={loading} error={error} alerts={alertList}>
      <ResourceForm initialVal={initialVal} handleSubmit={handleEditNode} editing />
    </PageBasic>
  );
};

export default ResourceEdit;
