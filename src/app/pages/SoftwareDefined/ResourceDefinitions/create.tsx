import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';
import ResourceDefinitionForm from './components/ResourceDefinitionForm';
import { convertRoundUp } from '@app/utils/size';
import service from '@app/requests';
import { notifyList } from '@app/utils/toast';

const Create: React.FC = () => {
  const history = useHistory();

  const { run: createVolumeDefinition } = useRequest(
    (resourceDefinition, body) => ({
      url: `/v1/resource-definitions/${resourceDefinition}/volume-definitions`,
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

  const { loading, run: createResourceDefinition } = useRequest(
    (body) => ({
      url: '/v1/resource-definitions',
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

  const { run: autoPlace } = useRequest(
    (resourceDefinition, placeData) => {
      return {
        url: `/v1/resource-definitions/${resourceDefinition}/autoplace`,
        placeData,
      };
    },
    {
      manual: true,
      requestMethod: (params) => {
        return service.post(params.url, params.placeData).catch((errorArray) => {
          if (errorArray) {
            notifyList(errorArray);
          }
        });
      },
    }
  );

  const submitResourceDefinition = async (data) => {
    const submitData = {
      resource_definition: {
        name: data.name,
        props: {
          'DrbdOptions/Net/protocol': data.replication_mode,
          'DrbdOptions/PeerDevice/c-max-rate': '4194304',
        },
        resource_group_name: data.resource_group_name,
        volume_definitions: [],
      },
    };

    // handle size input value
    const size = convertRoundUp(data.size.unit, data.size.number);

    const res = await createResourceDefinition(submitData);

    if (res) {
      const volumeDefinitionData = {
        volume_definition: {
          size_kib: size,
          props: {
            StorPoolName: data.resource_group_name,
          },
        },
      };
      const volumeCreated = await createVolumeDefinition(data.name, volumeDefinitionData);

      if (data.deploy === 'yes' && volumeCreated) {
        const deployData = {
          diskless_on_remaining: data.diskless,
          select_filter: { place_count: Number(data.place_count) },
        };
        const placeSuccess = await autoPlace(data.name, deployData);
        if (placeSuccess) {
          history.push('/software-defined/resource-definitions');
        }
      } else {
        history.push('/software-defined/resource-definitions');
      }
    }
  };

  return (
    <PageBasic title="Create Resource Definition">
      <ResourceDefinitionForm handleSubmit={submitResourceDefinition} loading={loading} />
    </PageBasic>
  );
};

export default Create;
