import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';

import ResourceForm from './components/ResourceForm';
import service from '@app/requests';

const ResourceCreate: React.FC = () => {
  const history = useHistory();
  const [alertList, setAlertList] = useState<alertList>([]);

  const { loading, run: createResource } = useRequest(
    (resourceDefinition, node, body) => ({
      url: `/v1/resource-definitions/${resourceDefinition}/resources/${node}`,
      body,
    }),
    {
      manual: true,
      requestMethod: (params) => {
        return service.post(params.url, params.body).catch((errorArray) => {
          if (errorArray) {
            setAlertList(
              errorArray.map((e) => ({
                variant: 'danger',
                key: (e.ret_code + new Date()).toString(),
                title: e.message,
                show: true,
              }))
            );
          }
        });
      },
      onSuccess: (data) => {
        if (data) {
          setAlertList([
            {
              title: 'Success',
              variant: 'success',
              key: new Date().toString(),
            },
          ]);
          setTimeout(() => {
            history.push('/software-defined/resources');
          }, 500);
        }
      },
    }
  );

  const { run: placeResource } = useRequest(
    (resourceDefinition, body) => ({
      url: `/v1/resource-definitions/${resourceDefinition}/autoplace`,
      body,
    }),
    {
      manual: true,
      requestMethod: (params) => {
        return service.post(params.url, params.body).catch((errorArray) => {
          if (errorArray) {
            setAlertList(
              errorArray.map((e) => ({
                variant: 'danger',
                key: (e.ret_code + new Date()).toString(),
                title: e.message,
                show: true,
              }))
            );
          }
        });
      },
    }
  );

  const handleAdd = async (data) => {
    console.log(data, 'Resource');
    if (data.allocate_method === 'manual') {
      const resourceData = {
        resource: {
          name: data.resource_definition_name,
          node_name: data.node,
          props: { StorPoolName: data.storage_pool, PrefNic: data.network_preference },
        },
      };

      if (data.diskless) {
        Object.assign(resourceData, {
          resource: {
            ...resourceData.resource,
            flags: ['DISKLESS'],
          },
        });
      }

      await createResource(data.resource_definition_name, data.node, resourceData);
    } else {
      const placeData = {
        diskless_on_remaining: data.diskless,
        select_filter: { place_count: Number(data.place_count), storage_pool: data.storage_pool },
      };

      await placeResource(data.resource_definition_name, placeData);
    }
  };

  return (
    <PageBasic title="Create Resource" alerts={alertList}>
      <ResourceForm handleSubmit={handleAdd} loading={loading} />
    </PageBasic>
  );
};

export default ResourceCreate;
