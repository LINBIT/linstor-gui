import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';

import FilterList from '@app/components/FilterList';
import PageBasic from '@app/components/PageBasic';
import { headerCol, ICell } from '@patternfly/react-table';
import { TRGList } from '@app/interfaces/resourceGroup';
import service from '@app/requests';
import PropertyForm from '@app/components/PropertyForm';
import { Modal, ModalVariant } from '@patternfly/react-core';
import DynamicForm from '@app/components/DynamicForm';
import { uniqId } from '@app/utils/stringUtils';
import { TYPE_MAP } from '@app/interfaces/dynamicFormType';
import { convertRoundUp, sizeOptions } from '@app/utils/size';
import { notify, notifyList } from '@app/utils/toast';
import { List } from '@app/features/resourceGroup';

const ResourceGroupList: React.FunctionComponent = () => {
  const { t } = useTranslation(['resource_group', 'common']);
  const [fetchList, setFetchList] = useState(false);
  const history = useHistory();
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const [current, setCurrent] = useState();
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const { run: deleteResourceGroup } = useRequest(
    (resourceGroup, _isBatch = false) => ({
      url: `/v1/resource-groups/${resourceGroup}`,
      _isBatch,
    }),
    {
      manual: true,
      requestMethod: (params) => {
        return service
          .delete(params.url)
          .then((res) => {
            if (res) {
              notifyList(res.data);
              setFetchList(!fetchList);
            }
          })
          .catch((errorArray) => {
            if (errorArray) {
              notifyList(errorArray);
            }
            if (params._isBatch) {
              setFetchList(!fetchList);
            }
          });
      },
    }
  );

  const { run: deploy, loading: deploying } = useRequest(
    (resourceGroup, placeData) => {
      return {
        url: `/v1/resource-groups/${resourceGroup}/spawn`,
        placeData,
      };
    },
    {
      manual: true,
      requestMethod: (params) => {
        return service
          .post(params.url, params.placeData)
          .then((res) => {
            if (res.data) {
              notifyList(res.data);
              setShowDeployModal(false);
            }
          })
          .catch((errorArray) => {
            if (errorArray) {
              notifyList(errorArray);
            }
          });
      },
    }
  );

  const { run: handleUpdateResourceGroup } = useRequest(
    (body) => ({
      url: `/v1/resource-groups/${current}`,
      body,
    }),
    {
      manual: true,
      requestMethod: (param) => {
        return service.put(param.url, param.body).catch((errorArray) => {
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
          setFetchList(!fetchList);
          setPropertyModalOpen(false);
        }
      },
    }
  );

  const replicationMap = useMemo(
    () => ({
      A: t('async'),
      B: t('semi_sync'),
      C: t('sync'),
    }),
    [t]
  );

  const columns = [
    { title: t('name'), cellTransforms: [headerCol()] },
    { title: t('place_count') },
    { title: t('storage_pools') },
    { title: t('replication') },
    { title: t('diskless') },
    { title: t('description') },
    { title: '' },
  ];

  const cells = (cell: unknown) => {
    const item = cell as TRGList[0];
    const props = item.props || {};
    const select_filter = item.select_filter || {};
    return [
      item.name,
      item.select_filter?.place_count,
      Array.isArray(select_filter?.storage_pool_list) ? (select_filter?.storage_pool_list ?? []).join(',') : t('auto'),
      replicationMap[props['DrbdOptions/Net/protocol']],
      item.select_filter?.diskless_on_remaining ? 'Yes' : 'No',
      item.description,
      props,
    ] as ICell[];
  };

  const listActions = [
    {
      title: t('common:deploy'),
      onClick: (event, rowId, rowData, extra) => {
        setShowDeployModal(true);
        setCurrent(rowData.cells[0]);
      },
    },
    {
      title: t('common:property'),
      onClick: (event, rowId, rowData, extra) => {
        const resourceGroup = rowData.cells[0];
        const currentData = rowData.cells[6] ?? {};
        setInitialProps(currentData);
        setPropertyModalOpen(true);
        setCurrent(resourceGroup);
      },
    },
    {
      title: t('common:edit'),
      onClick: (event, rowId, rowData, extra) => {
        const resource_group = rowData.cells[0];
        history.push(`/storage-configuration/resource-groups/${resource_group}/edit`);
      },
    },
    {
      title: t('common:delete'),
      onClick: async (event, rowId, rowData, extra) => {
        const resourceGroupName = rowData.cells[0];
        await deleteResourceGroup(resourceGroupName);
      },
    },
  ];

  const toolButtons = useMemo(() => {
    return [
      {
        label: t('common:add'),
        variant: 'primary',
        alwaysShow: true,
        onClick: () => history.push('/storage-configuration/resource-groups/create'),
      },
      {
        label: t('common:delete'),
        variant: 'danger',
        onClick: (selected) => {
          const batchDeleteRequests = selected.map((e) => deleteResourceGroup(e.cells[0], true));

          Promise.all(batchDeleteRequests).then((res) => {
            if (res.filter((e) => e).length > 0) {
              notify('Success', {
                type: 'success',
              });
              setFetchList(!fetchList);
            }
          });
        },
      },
    ];
  }, [deleteResourceGroup, fetchList, history, t]);

  const handleDeploy = async (data) => {
    const size = convertRoundUp(data.size.unit, data.size.number);

    const submitData = {
      resource_definition_name: data.name,
      resource_definition_external_name: null,
      volume_sizes: [size],
      definitions_only: data.definitions_only,
    };

    await deploy(current, submitData);
  };

  return (
    <PageBasic title={t('list')}>
      <List />
      {/* <FilterList
        showSearch
        url="/v1/resource-groups"
        filerField="connection_status"
        actions={listActions}
        fetchList={fetchList}
        toolButtons={toolButtons}
        columns={columns}
        cells={cells}
        statsUrl="/v1/stats/resource-groups"
      />
      <PropertyForm
        initialVal={initialProps}
        openStatus={propertyModalOpen}
        type="resource-definition"
        handleSubmit={handleUpdateResourceGroup}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
      <Modal
        variant={ModalVariant.small}
        title="Deploy"
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(!showDeployModal)}
        className="linbit_modal"
      >
        <DynamicForm
          propertyForm={true}
          formItems={[
            {
              id: uniqId(),
              name: 'name',
              type: TYPE_MAP.TEXT,
              label: 'Resource Definition Name',
              defaultValue: '',
              validationInfo: {
                isRequired: true,
              },
            },
            {
              id: uniqId(),
              name: 'size',
              type: TYPE_MAP.SIZE,
              defaultValue: 0,
              label: 'Volume Size',
              validationInfo: {
                isRequired: true,
                invalidMessage: 'Volume size is required',
              },
              extraInfo: {
                options: sizeOptions.map((e) => ({ ...e, isDisabled: false })),
              },
            },
            {
              id: uniqId(),
              name: 'definitions_only',
              type: TYPE_MAP.CHECKBOX,
              label: 'Definition only',
              defaultValue: false,
              validationInfo: {
                isRequired: false,
              },
            },
          ]}
          handleSubmitData={handleDeploy}
          handleCancelClick={() => setShowDeployModal(false)}
          submitting={deploying}
        />
      </Modal> */}
    </PageBasic>
  );
};

export default ResourceGroupList;
