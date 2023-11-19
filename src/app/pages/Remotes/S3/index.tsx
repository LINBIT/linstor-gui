import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { headerCol, ICell } from '@patternfly/react-table';
import get from 'lodash.get';
import { useRequest } from 'ahooks';

import FilterList from '@app/components/FilterList';
import PageBasic from '@app/components/PageBasic';
import { VolumeType } from '@app/interfaces/resource';
import { formatBytes } from '@app/utils/size';
import PropertyForm from '@app/components/PropertyForm';
import service from '@app/requests';
import { notify, notifyList } from '@app/utils/toast';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['volume', 'common']);
  const [fetchList, setFetchList] = useState(false);

  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const [current, setCurrent] = useState();
  const [currentNode, setCurrentNode] = useState();
  const [currentVolume, setCurrentVolume] = useState();

  const columns = [
    { title: t('resource') },
    { title: t('node'), cellTransforms: [headerCol()] },
    { title: t('storage_pool') },
    { title: t('device_name') },
    { title: t('allocated') },
    { title: t('in_use') },
    { title: t('state') },
    { title: '' },
  ];

  const cells = (cell: unknown) => {
    const item = cell as VolumeType & {
      resource_name: string;
      node_name: string;
      in_use: boolean;
    };
    return [
      item.resource_name,
      item.node_name,
      item.storage_pool_name,
      item.device_path,
      formatBytes(item.allocated_size_kib),
      item.in_use ? t('in_use') : t('un_used'),
      get(item, 'state.disk_state'),
      { ...item.props, volume_number: item.volume_number },
    ] as ICell[];
  };

  const listActions = [
    {
      title: t('common:property'),
      onClick: (event, rowId, rowData, extra) => {
        const resource = rowData.cells[0];
        const node = rowData.cells[1];
        const currentData = rowData.cells[7] ?? {};

        setInitialProps(currentData);
        setCurrentVolume(currentData.volume_number);
        setPropertyModalOpen(true);
        setCurrent(resource);
        setCurrentNode(node);
      },
    },
  ];

  const { run: handleUpdateVolumeProps } = useRequest(
    (body) => ({
      // /v1/resource-definitions/MyRD02/resources/node104/volumes/0
      url: `/v1/resource-definitions/${current}/resources/${currentNode}/volumes/${currentVolume}`,
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

  const filterFunc = useCallback((item) => Array.isArray(item.volumes) && item.volumes.length > 0, []);

  const customHandler = useCallback((data) => {
    const volumes: VolumeType[] = [];

    for (const item of data) {
      volumes.push(
        ...item.volumes.map((e) => ({ ...e, node_name: item.node_name, resource_name: item.name, in_use: item.in_use }))
      );
    }

    return volumes;
  }, []);

  return (
    <PageBasic title={t('list')}>
      <FilterList
        showSearch
        url="/v1/view/resources"
        actions={listActions}
        fetchList={fetchList}
        filterFunc={filterFunc}
        customHandler={customHandler}
        columns={columns}
        cells={cells}
        statsUrl="/v1/stats/resources"
      />
      <PropertyForm
        initialVal={initialProps}
        openStatus={propertyModalOpen}
        type="resource"
        handleSubmit={handleUpdateVolumeProps}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </PageBasic>
  );
};

export default List;
