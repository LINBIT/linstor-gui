import React from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';

import ResourceForm from './components/ResourceForm';
import service from '@app/requests';
import { notify, notifyList } from '@app/utils/toast';
import { useTranslation } from 'react-i18next';

const ResourceCreate: React.FC = () => {
  const history = useHistory();

  const { t } = useTranslation(['common']);

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
            notifyList(errorArray);
          }
        });
      },
      onSuccess: (data) => {
        if (data) {
          notify('Success', {
            type: 'success',
          });
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
            notifyList(errorArray);
          }
        });
      },
    }
  );

  const handleAdd = async (data) => {
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
    <PageBasic title="Create Resource">
      <ResourceForm handleSubmit={handleAdd} loading={loading} />
    </PageBasic>
  );
};

export default ResourceCreate;
