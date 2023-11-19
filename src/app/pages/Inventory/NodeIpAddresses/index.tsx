import React, { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { headerCol, ICell } from '@patternfly/react-table';

import FilterList from '@app/components/FilterList';
import PageBasic from '@app/components/PageBasic';
import { NetInterfaceType } from '@app/interfaces/net_interface';
import { useRequest } from 'ahooks';
import service from '@app/requests';
import YesOrNo from '@app/components/YesOrNo';
import { notify, notifyList } from '@app/utils/toast';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['ip_address', 'common']);
  const history = useHistory();
  const [fetchList, setFetchList] = useState(false);

  const { run: deleteIpAddress } = useRequest(
    (node, idAddress, _isBatch = false) => ({
      url: `/v1/nodes/${node}/net-interfaces/${idAddress}`,
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

  const columns = [
    { title: t('node'), cellTransforms: [headerCol()] },
    { title: t('ip_address') },
    { title: t('tcp_port') },
    { title: t('alias') },
    { title: t('is_management_network') },
  ];

  const cells = (cell: unknown) => {
    const item = cell as NetInterfaceType & {
      node_name: string;
    };
    return [
      item.node_name,
      item.address,
      item.satellite_port,
      item.name,
      {
        title: <YesOrNo value={item?.is_active} position="left" />,
      },
    ] as ICell[];
  };

  const listActions = [
    {
      title: t('common:edit'),
      onClick: (event, rowId, rowData, extra) => {
        const ip = rowData.cells[3];
        const node = rowData.cells[0];
        history.push(`/inventory/ip/${node}/${ip}/edit`);
      },
    },
    {
      title: t('common:delete'),
      onClick: async (event, rowId, rowData, extra) => {
        const node = rowData.cells[0];
        const resource = rowData.cells[3];
        await deleteIpAddress(node, resource, false);
      },
    },
  ];

  const toolButtons = useMemo(() => {
    return [
      {
        label: t('common:add'),
        variant: 'primary',
        alwaysShow: true,
        onClick: () => history.push('/inventory/ip/create'),
      },
      {
        label: t('common:delete'),
        variant: 'danger',
        onClick: (selected) => {
          const batchDeleteRequests = selected.map((e) => {
            const node = e.cells[0];
            const resource = e.cells[3];
            return deleteIpAddress(node, resource, true);
          });

          Promise.all(batchDeleteRequests).then((res) => {
            if (res) {
              setFetchList(!fetchList);
            }
          });
        },
      },
    ];
  }, [deleteIpAddress, fetchList, history, t]);

  const filterFunc = useCallback((item) => Array.isArray(item.net_interfaces) && item.net_interfaces.length > 0, []);

  const customHandler = useCallback((data) => {
    const net_interfaces: NetInterfaceType = [];

    for (const item of data) {
      net_interfaces.push(
        ...item.net_interfaces.map((e) => ({
          ...e,
          node_name: item.name,
        }))
      );
    }

    return net_interfaces;
  }, []);

  return (
    <PageBasic title={t('list')}>
      <FilterList
        fetchList={fetchList}
        showSearch
        url="/v1/nodes"
        actions={listActions}
        toolButtons={toolButtons}
        filterFunc={filterFunc}
        customHandler={customHandler}
        columns={columns}
        cells={cells}
        statsUrl="/v1/stats/nodes"
      />
    </PageBasic>
  );
};

export default List;
