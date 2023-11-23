import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import get from 'lodash.get';

import FilterList from '@app/components/FilterList';
import PageBasic from '@app/components/PageBasic';
import { headerCol, ICell } from '@patternfly/react-table';
import { TRDList } from '@app/interfaces/resourceDefinition';
import PropertyForm from '@app/components/PropertyForm';
import service from '@app/requests';
import { omit } from '@app/utils/object';
import { Modal, ModalVariant } from '@patternfly/react-core';
import DynamicForm from '@app/components/DynamicForm';
import { uniqId } from '@app/utils/stringUtils';
import { TYPE_MAP } from '@app/interfaces/dynamicFormType';
import { notify, notifyList } from '@app/utils/toast';
import { useKVStore } from '@app/hooks';

const ResourceDefinitionList: React.FunctionComponent = () => {
  const { t } = useTranslation(['resource_definition', 'common']);
  const [fetchList, setFetchList] = useState(false);

  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const history = useHistory();
  const [current, setCurrent] = useState();
  const [showDeployModal, setShowDeployModal] = useState(false);

  const kvs = useKVStore();
  const vsanMode = kvs?.vsanMode as boolean;

  const { run: deleteResourceDefinition } = useRequest(
    (resourceDefinitionName, _isBatch = false) => ({
      url: `/v1/resource-definitions/${resourceDefinitionName}`,
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
        return service
          .post(params.url, params.placeData)
          .then((res) => {
            if (res.data) {
              notifyList(res.data);
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

  const { run: handleUpdateResourceDefinition } = useRequest(
    (body) => ({
      url: `/v1/resource-definitions/${current}`,
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

  const handleDeploy = async (data) => {
    const submitData = { diskless_on_remaining: data.diskless, select_filter: { place_count: data.place_count } };
    await autoPlace(current, submitData);
    setShowDeployModal(false);
  };

  const columns = [
    { title: t('name'), cellTransforms: [headerCol()] },
    { title: t('resource_group_name') },
    { title: t('size') },
    { title: t('port') },
    { title: t('state') },
    { title: '' },
  ];

  const cells = (cell: unknown) => {
    const item = cell as TRDList[0];
    const props = item.props ?? {};
    return [
      item.name,
      item.resource_group_name,
      get(item, 'volume_definitions[0].size_kib', 0) + ' KiB',
      get(item, 'layer_data[0].data.port', ''),
      item.flags?.find((flag) => flag === 'DELETE') != null ? 'DELETING' : 'OK',
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
        const currentData = omit(
          rowData.cells[5] ?? {},
          'DrbdPrimarySetOn',
          'NVMe/TRType',
          'DrbdOptions/auto-verify-alg'
        );
        setInitialProps(currentData);
        setPropertyModalOpen(true);
        setCurrent(resourceGroup);
      },
    },
    {
      title: t('common:edit'),
      onClick: (event, rowId, rowData, extra) => {
        const resourceDefinitionName = rowData.cells[0];
        history.push(`/storage-configuration/resource-definitions/${resourceDefinitionName}/edit`);
      },
    },
    {
      title: t('common:delete'),
      onClick: async (event, rowId, rowData, extra) => {
        const resourceDefinitionName = rowData.cells[0];
        await deleteResourceDefinition(resourceDefinitionName);
      },
    },
  ];

  const toolButtons = useMemo(() => {
    return [
      {
        label: t('common:add'),
        variant: 'primary',
        alwaysShow: true,
        onClick: () => history.push('/storage-configuration/resource-definitions/create'),
      },
      {
        label: t('common:delete'),
        variant: 'danger',
        onClick: (selected) => {
          const batchDeleteRequests = selected.map((e) => deleteResourceDefinition(e.cells[0], true));

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
  }, [deleteResourceDefinition, fetchList, history, t]);

  return (
    <PageBasic title={t('list')}>
      <FilterList
        showSearch
        url="/v1/resource-definitions"
        filerField="connection_status"
        actions={vsanMode ? [] : listActions}
        fetchList={fetchList}
        toolButtons={vsanMode ? [] : toolButtons}
        columns={columns}
        cells={cells}
        statsUrl="/v1/stats/resource-definitions"
      />

      <PropertyForm
        initialVal={initialProps}
        openStatus={propertyModalOpen}
        type="resource-definition"
        handleSubmit={handleUpdateResourceDefinition}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />

      <Modal
        variant={ModalVariant.small}
        title="Deploy"
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(!showDeployModal)}
      >
        <DynamicForm
          formItems={[
            {
              id: uniqId(),
              name: 'diskless',
              type: TYPE_MAP.CHECKBOX,
              label: 'Diskless',
              defaultValue: false,
              validationInfo: {
                isRequired: false,
              },
            },
            {
              id: uniqId(),
              name: 'place_count',
              type: TYPE_MAP.INTEGER,
              defaultValue: 1,
              label: 'Place Count',
              validationInfo: {
                isRequired: true,
                min: 1,
                invalidMessage: 'Place count must be a number',
              },
            },
          ]}
          handleSubmitData={handleDeploy}
          handleCancelClick={() => setShowDeployModal(false)}
        />
      </Modal>
    </PageBasic>
  );
};

export default ResourceDefinitionList;
