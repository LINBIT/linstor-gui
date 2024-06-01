import React from 'react';
import { useParams } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';
import ResourceDefinitionForm from './components/ResourceDefinitionForm';
import service from '@app/requests';
import get from 'lodash.get';
import { notify, notifyList } from '@app/utils/toast';
import { useQuery } from '@tanstack/react-query';
import { CreateForm, getResourceDefinition } from '@app/features/resourceDefinition';

const Edit: React.FC = () => {
  const { resourceDefinition } = useParams() as { resourceDefinition: string };

  const { data, isLoading } = useQuery({
    queryKey: ['getRD', resourceDefinition],
    queryFn: () => {
      return getResourceDefinition({
        resource_definitions: [resourceDefinition],
      });
    },
    enabled: !!resourceDefinition,
  });

  const detailData = data?.data;

  // const handleEditResourceDefinition = async (data) => {
  //   const updateData = {
  //     override_props: {
  //       'DrbdOptions/Net/protocol': data.replication_mode,
  //       'DrbdOptions/PeerDevice/c-max-rate': '4194304',
  //     },
  //     resource_group: data.resource_group_name,
  //   };
  //   await updateResourceDefinition(updateData);
  // };

  const initialVal = {
    name: detailData?.[0]?.name,
    resource_group_name: detailData?.[0].resource_group_name,
    replication_mode: get(detailData?.[0], 'props[DrbdOptions/Net/protocol]'),
  };

  return (
    <PageBasic title="Edit Resource Definition" loading={isLoading}>
      <CreateForm initialValues={initialVal} isEdit />
      {/* <ResourceDefinitionForm initialVal={initialVal} editing={true} /> */}
    </PageBasic>
  );
};

export default Edit;
