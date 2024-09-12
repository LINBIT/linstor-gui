import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';
import ResourceGroupForm from './components/ResourceGroupForm';
import get from 'lodash.get';
import service from '@app/requests';

const ResourceGroupEdit: React.FC = () => {
  const [alertList, setAlertList] = useState<alertList>([]);
  const { resourceGroup } = useParams() as { resourceGroup: string };

  const {
    data,
    loading,
    error,
    run: getResourceGroupDetail,
  } = useRequest(
    (resource_group: string) => ({
      url: `/v1/resource-groups?resource_groups=${resource_group}`,
    }),
    {
      manual: true,
    }
  );

  const { run: updateResourceGroup } = useRequest(
    (body) => ({
      url: `/v1/resource-groups/${resourceGroup}`,
      body,
    }),
    {
      manual: true,
      requestMethod: (param) => {
        return service
          .put(param.url, param.body)
          .then((res) => {
            if (res) {
              setAlertList(
                res.data.map((e) => ({
                  variant: e.ret_code > 0 ? 'success' : 'danger',
                  key: (e.ret_code + new Date()).toString(),
                  title: e.message,
                }))
              );
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

  useEffect(() => {
    console.log(resourceGroup);
    (async function () {
      if (resourceGroup) {
        await getResourceGroupDetail(resourceGroup);
      }
    })();
  }, [resourceGroup, getResourceGroupDetail]);

  const handleEditNode = async (data) => {
    const {
      description,
      data_copy_mode,
      place_count,
      diskless_on_remaining,
      not_place_with_rsc_regex,
      replicas_on_same,
      replicas_on_different,
      not_place_with_rsc,
      storage_pool_list,
      layer_stack,
      provider_list,
    } = data;

    const submitData = {
      description: description ?? '',
      override_props: {
        'DrbdOptions/Net/protocol': data_copy_mode ?? 'A',
        'DrbdOptions/PeerDevice/c-max-rate': '4194304',
      },
      select_filter: {
        place_count: place_count,
        not_place_with_rsc: not_place_with_rsc ?? [],
        not_place_with_rsc_regex: not_place_with_rsc_regex ?? '',
        replicas_on_same: replicas_on_same ?? [],
        replicas_on_different: replicas_on_different ?? [],
        storage_pool_list: storage_pool_list ?? [],
        provider_list: provider_list ?? [],
        layer_stack: layer_stack ?? [],
        diskless_on_remaining: diskless_on_remaining ?? false,
      },
    };
    console.log(submitData, 'data');
    await updateResourceGroup(submitData);
  };

  /**
   * Add a empty state
   */
  const emptyState = useMemo(() => {
    return Array.isArray(data) && data.length === 0;
  }, [data]);

  // FIXME: remove loading and error state
  const initialVal =
    !loading && !emptyState
      ? {
          name: data?.[0]?.name,
          description: data?.[0]?.description,
          data_copy_mode: get(data?.[0], 'props[DrbdOptions/Net/protocol]'),
          diskless_on_remaining: get(data?.[0], 'select_filter.diskless_on_remaining'),
          storage_pool_list: get(data?.[0], 'select_filter.storage_pool_list', []),
          layer_stack: get(data?.[0], 'select_filter.layer_stack', []).map((e) => e.toLowerCase()),
          provider_list: get(data?.[0], 'select_filter.provider_list', []).map((e) => e.toLowerCase()),
          replicas_on_same: get(data?.[0], 'select_filter.replicas_on_same', []),
          replicas_on_different: get(data?.[0], 'select_filter.replicas_on_different', []),
          not_place_with_rsc: get(data?.[0], 'select_filter.not_place_with_rsc', ''),
          not_place_with_rsc_regex: get(data?.[0], 'select_filter.not_place_with_rsc_regex', ''),
        }
      : undefined;

  return (
    <PageBasic title="Edit Resource Group" loading={loading} error={error || emptyState} alerts={alertList}>
      <ResourceGroupForm initialVal={initialVal} handleSubmit={handleEditNode} editing={true} />
    </PageBasic>
  );
};

export default ResourceGroupEdit;
