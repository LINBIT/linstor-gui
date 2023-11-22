import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { Label } from '@patternfly/react-core';
import { headerCol, ICell } from '@patternfly/react-table';

import YesOrNo from '@app/components/YesOrNo';
import FilterList from '@app/components/FilterList';
import PageBasic from '@app/components/PageBasic';
import PropertyForm from '@app/components/PropertyForm';
import { StoragePoolList } from '@app/interfaces/storagePools';
import service from '@app/requests';
import { useKVStore } from '@app/hooks';
import { notify, notifyList } from '@app/utils/toast';
import { formatBytes } from '@app/utils/size';
import { deleteStoragePoolV2 } from '@app/features/storagePool';

const StoragePoolList: React.FunctionComponent = () => {
  const { t } = useTranslation(['storage_pool', 'common']);
  const [fetchList, setFetchList] = useState(false);
  const history = useHistory();
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const [current, setCurrent] = useState();
  const [currentNode, setCurrentNode] = useState();
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);

  const kvs = useKVStore();
  const gatewayEnabled = kvs.vsanMode as boolean;

  const { run: handleUpdateStoragePool } = useRequest(
    (body) => ({
      url: `/v1/nodes/${currentNode}/storage-pools/${current}`,
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

  const columns = [
    { title: t('name'), cellTransforms: [headerCol()] },
    { title: t('node_name') },
    { title: t('provider_kind') },
    { title: t('disk') },
    { title: t('free_capacity') },
    { title: t('total_capacity') },
    { title: t('supports_snapshots') },
    { title: '' },
  ];

  const providerKindColorMap = {
    LVM: 'orange',
    ZFS: 'blue',
    LVM_THIN: 'green',
    ZFS_THIN: 'purple',
  };

  const cells = (cell: unknown) => {
    const item = cell as StoragePoolList[0];
    const props = item.props || {};
    return [
      item?.storage_pool_name,
      item?.node_name,
      {
        title: (
          <div>
            {item?.provider_kind ? (
              <Label color={providerKindColorMap[item.provider_kind]}>{item?.provider_kind}</Label>
            ) : (
              '--'
            )}
          </div>
        ),
      },
      props?.['StorDriver/StorPoolName'],
      {
        title:
          item.total_capacity && item.free_capacity && item.provider_kind !== 'DISKLESS' ? (
            <div>{formatBytes(item.free_capacity)}</div>
          ) : (
            '--'
          ),
      },
      {
        title:
          item.total_capacity && item.free_capacity && item.provider_kind !== 'DISKLESS' ? (
            <div>{formatBytes(item.total_capacity)}</div>
          ) : (
            '--'
          ),
      },
      // {
      //   title:
      //     item.total_capacity && item.free_capacity && item.provider_kind !== 'DISKLESS' ? (
      //       <div>
      //         <Progress
      //           value={((item.total_capacity - item.free_capacity) / item.total_capacity) * 100}
      //           label={`
      //               Free: ${formatBytes(item.free_capacity)} \n
      //               Total: ${formatBytes(item.total_capacity)}`}
      //           size={ProgressSize.sm}
      //           measureLocation="outside"
      //         />
      //       </div>
      //     ) : (
      //       '--'
      //     ),
      // },
      {
        title: <YesOrNo value={item?.supports_snapshots} />,
      },
      { ...props },
    ] as ICell[];
  };

  const listActions = [
    {
      title: t('common:property'),
      onClick: (event, rowId, rowData, extra) => {
        const storagePool = rowData.cells[0];
        const currentNode = rowData.cells[1];
        const currentData = rowData.cells[7] ?? {};
        setInitialProps(currentData);
        setPropertyModalOpen(true);
        setCurrent(storagePool);
        setCurrentNode(currentNode);
      },
      isDisabled: gatewayEnabled,
    },
    {
      title: t('common:edit'),
      onClick: (event, rowId, rowData, extra) => {
        const storagePool = rowData.cells[0];
        const node = rowData.cells[1];
        history.push(`/inventory/storage-pools/${node}/${storagePool}/edit`);
      },
    },
    {
      title: t('common:delete'),
      onClick: async (event, rowId, rowData, extra) => {
        const node = rowData.cells[1];
        const storagePoolName = rowData.cells[0];
        const data = await deleteStoragePoolV2({ node, storagepool: storagePoolName });
        if (!data.error) {
          setFetchList(!fetchList);
        }
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
          const batchDeleteRequests = selected.map((e) =>
            deleteStoragePoolV2({ node: e.cells[1], storagepool: e.cells[0] })
          );

          Promise.all(batchDeleteRequests).finally(() => {
            setFetchList(!fetchList);
          });
        },
      },
    ];
  }, [fetchList, history, t]);

  return (
    <PageBasic title={t('list')}>
      <FilterList
        showSearch
        url="/v1/view/storage-pools"
        filerField="connection_status"
        actions={listActions}
        fetchList={fetchList}
        toolButtons={toolButtons}
        columns={columns}
        cells={cells}
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
