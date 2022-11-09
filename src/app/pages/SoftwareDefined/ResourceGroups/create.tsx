import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';

import ResourceGroupForm from './components/ResourceGroupForm';
import service from '@app/requests';
import { notify, notifyList } from '@app/utils/toast';
import { useTranslation } from 'react-i18next';

const ResourceGroupCreate: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [pass, setPass] = useState(false);
  const history = useHistory();

  const { run: createVolume } = useRequest(
    (resource_group_name: string) => ({
      url: `/v1/resource-groups/${resource_group_name}/volume-groups`,
    }),
    {
      manual: true,
      requestMethod: (params) => service.post(params.url, {}),
    }
  );

  const { run: updateResourceGroup } = useRequest(
    (resource_group_name: string, data) => ({
      url: `/v1/resource-groups/${resource_group_name}`,
      data,
    }),
    {
      manual: true,
      requestMethod: (params) => service.put(params.url, params.data),
      onSuccess: (data) => {
        if (data) {
          notify('Success', {
            type: 'success',
          });
          setTimeout(() => {
            history.push('/software-defined/resource-groups');
          }, 500);
        }
      },
    }
  );

  const { loading, run: handleAddResourceGroup } = useRequest(
    (body) => ({
      url: '/v1/resource-groups',
      body,
    }),
    {
      manual: true,
      requestMethod: (param) => {
        return service.post(param.url, param.body).catch((errorArray) => {
          if (errorArray) {
            setPass(true);
            notifyList(errorArray);
          }
        });
      },
      throwOnError: true,
    }
  );

  const handleAdd = async (data) => {
    setPass(false);
    const rg = {
      name: data.name,
      description: data.description,
      select_filter: {
        not_place_with_rsc: data.not_place_with_rsc,
        not_place_with_rsc_regex: data.not_place_with_rsc_regex,
        replicas_on_same: data.replicas_on_same,
        replicas_on_different: data.replicas_on_different,
        diskless_on_remaining: data.diskless_on_remaining,
        storage_pool_list: data.storage_pool_list,
        layer_stack: data.layer_stack,
        provider_list: data.provider_list,
        place_count: Number(data.place_count),
      },
    };

    const props = {
      override_props: {
        'DrbdOptions/Net/protocol': data.data_copy_mode,
        'DrbdOptions/PeerDevice/c-max-rate': '4194304',
      },
    };

    console.log(rg, 'RG');
    try {
      await handleAddResourceGroup(rg);
      if (!pass) {
        await createVolume(data.name);
        await updateResourceGroup(data.name, props);
      }
    } catch (e) {
      console.log(e, 'e');
    }
  };

  return (
    <PageBasic title="Create Resource Group">
      <ResourceGroupForm handleSubmit={handleAdd} loading={loading} />
    </PageBasic>
  );
};

export default ResourceGroupCreate;
