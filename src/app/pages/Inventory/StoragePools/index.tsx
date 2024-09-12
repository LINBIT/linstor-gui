import React, { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { Button, Progress, ProgressSize } from '@patternfly/react-core';
import { headerCol, ICell } from '@patternfly/react-table';

import FilterList from '@app/components/FilterList';
import PageBasic from '@app/components/PageBasic';

import { TSPList } from '@app/interfaces/storagePools';
import PropertyForm from '@app/components/PropertyForm';
import service from '@app/requests';

const StoragePoolList: React.FunctionComponent = () => {
  const { t } = useTranslation(['storage_pool', 'common']);
  const [fetchList, setFetchList] = useState(false);
  const history = useHistory();
  const [alertList, setAlertList] = useState<alertList>([]);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const [current, setCurrent] = useState();
  const [currentNode, setCurrentNode] = useState();
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);

  const { run: deleteStoragePool } = useRequest(
    (node, storagePool, _isBatch = false) => ({
      url: `/v1/nodes/${node}/storage-pools/${storagePool}`,
      method: 'delete',
    }),
    {
      manual: true,
      onSuccess: (data, params) => {
        if (params[2]) {
          setFetchList(!fetchList);
        } else {
          setAlertList([
            {
              title: 'Success',
              variant: 'success',
              key: new Date().toString(),
            },
          ]);
        }
      },
    }
  );

  const { loading: updatingStoragePool, run: handleUpdateStoragePool } = useRequest(
    (body) => ({
      url: `/v1/nodes/${currentNode}/storage-pools/${current}`,
      body,
    }),
    {
      manual: true,
      requestMethod: (param) => {
        return service.put(param.url, param.body).catch((errorArray) => {
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
      onSuccess: (data) => {
        if (data) {
          setAlertList([
            {
              title: 'Success',
              variant: 'success',
              key: new Date().toString(),
            },
          ]);
          setFetchList(!fetchList);
          setPropertyModalOpen(false);
        }
      },
    }
  );

  const columns = [
    { title: t('name'), cellTransforms: [headerCol()] },
    { title: t('node_name') },
    { title: t('network_preference') },
    { title: t('provider_kind') },
    { title: t('disk') },
    { title: t('capacity') },
    { title: t('supports_snapshots') },
    { title: '' },
  ];

  const cells = (cell: unknown) => {
    const item = cell as TSPList[0];
    const props = item.props || {};
    return [
      item?.storage_pool_name,
      item?.node_name,
      props?.['PrefNic'] ?? '--',
      item?.provider_kind,
      props?.['StorDriver/StorPoolName'],
      {
        title:
          item.total_capacity && item.free_capacity ? (
            <div>
              <div>
                <Progress
                  value={((item.total_capacity - item.free_capacity) / item.total_capacity) * 100}
                  title={`
                    Free: ${Math.round(item.free_capacity / 1024 / 1024)} GB
                    Total: ${Math.round(item.total_capacity / 1024 / 1024)} GB`}
                  size={ProgressSize.lg}
                />
              </div>
            </div>
          ) : (
            '--'
          ),
      },
      {
        title: (
          <Button variant="secondary" isDisabled>
            {item?.supports_snapshots ? 'Support' : 'Not Support'}
          </Button>
        ),
      },
      { ...props },
    ] as ICell[];
  };

  const listActions = [
    {
      title: t('common:property'),
      onClick: (event, rowId, rowData, extra) => {
        const storagePool = rowData.cells[0];
        console.log('clicked on Some action, on row: ', rowData.cells[0]);
        const currentNode = rowData.cells[1];
        const currentData = rowData.cells[7] ?? {};
        console.log(currentData, 'currentData');
        setInitialProps(currentData);
        setPropertyModalOpen(true);
        setCurrent(storagePool);
        setCurrentNode(currentNode);
      },
    },
    {
      title: t('common:edit'),
      onClick: (event, rowId, rowData, extra) => {
        const storagePool = rowData.cells[0];
        const node = rowData.cells[1];
        console.log('clicked on Some action, on row: ', rowData.cells[0]);
        history.push(`/inventory/storage-pools/${node}/${storagePool}/edit`);
      },
    },
    {
      title: t('common:delete'),
      onClick: async (event, rowId, rowData, extra) => {
        console.log('clicked on Some action, on row: ', rowData);
        const node = rowData.cells[1];
        const storagePoolName = rowData.cells[0];
        await deleteStoragePool(node, storagePoolName);
      },
    },
  ];

  const toolButtons = useMemo(() => {
    return [
      {
        label: t('common:add'),
        variant: 'primary',
        alwaysShow: true,
        onClick: () => history.push('/inventory/storage-pools/create'),
      },
      {
        label: t('common:delete'),
        variant: 'danger',
        onClick: (selected) => {
          console.log('Will delete', selected);
          const batchDeleteRequests = selected.map((e) => deleteStoragePool(e.cells[1], e.cells[0], true));

          Promise.all(batchDeleteRequests).then((res) => {
            console.log(res, 'res');
            setAlertList([
              {
                title: 'Success',
                variant: 'success',
                key: new Date().toString(),
              },
            ]);
            setFetchList(!fetchList);
          });
        },
      },
    ];
  }, [deleteStoragePool, fetchList, history, t]);

  const filterFunc = useCallback((item) => item.storage_pool_name !== 'DfltDisklessStorPool', []);

  return (
    <PageBasic title={t('list')} alerts={alertList}>
      <FilterList
        showSearch
        url="/v1/view/storage-pools"
        filerField="connection_status"
        actions={listActions}
        fetchList={fetchList}
        toolButtons={toolButtons}
        columns={columns}
        cells={cells}
        filterFunc={filterFunc}
        statsUrl="/v1/stats/storage-pools"
      />
      <PropertyForm
        initialVal={initialProps}
        openStatus={propertyModalOpen}
        type="storagepool"
        handleSubmit={handleUpdateStoragePool}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </PageBasic>
  );
};

export default StoragePoolList;
