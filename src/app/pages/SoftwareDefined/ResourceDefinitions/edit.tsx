import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';
import ResourceDefinitionForm from './components/ResourceDefinitionForm';
import service from '@app/requests';
import get from 'lodash.get';

const Edit: React.FC = () => {
  const { resourceDefinition } = useParams() as { resourceDefinition: string };
  const [alertList, setAlertList] = useState<alertList>([]);

  const {
    data: initialVal,
    loading,
    error,
  } = useRequest(`/v1/resource-definitions?resource_definitions=${resourceDefinition}`, {
    requestMethod: (url) => {
      return service.get(url).then((res) => {
        const result = res.data || [];

        return {
          name: result[0]?.name,
          resource_group_name: result[0]?.resource_group_name,
          replication_mode: get(result?.[0], 'props[DrbdOptions/Net/protocol]'),
        };
      });
    },
  });

  const { run: updateResourceDefinition } = useRequest(
    (body) => ({ url: `/v1/resource-definitions/${resourceDefinition}`, body }),
    {
      manual: true,
      requestMethod: (param) => {
        return service
          .put(param.url, param.body)
          .then((res) => {
            if (res) {
              setAlertList([
                {
                  variant: 'success',
                  key: new Date().toString(),
                  title: 'Success',
                },
              ]);
            }
          })
          .catch((errorArray) => {
            if (errorArray) {
              setAlertList(
                errorArray.map((e) => ({
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

  const handleEditResourceDefinition = async (data) => {
    console.log(data, 'data');
    const updateData = {
      override_props: {
        'DrbdOptions/Net/protocol': data.replication_mode,
        'DrbdOptions/PeerDevice/c-max-rate': '4194304',
      },
      resource_group: data.resource_group_name,
    };
    await updateResourceDefinition(updateData);
  };

  return (
    <PageBasic title="Edit Resource Definition" loading={loading} error={error} alerts={alertList}>
      <ResourceDefinitionForm initialVal={initialVal} handleSubmit={handleEditResourceDefinition} editing={true} />
    </PageBasic>
  );
};

export default Edit;
