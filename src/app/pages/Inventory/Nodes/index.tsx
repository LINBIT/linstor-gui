import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { headerCol, ICell } from '@patternfly/react-table';

import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';

import FilterList from '@app/components/FilterList';
import PageBasic from '@app/components/PageBasic';
import service from '@app/requests';
import PropertyForm from '@app/components/PropertyForm';
import { omit } from '@app/utils/object';
import { useDispatch } from 'react-redux';
import { Dispatch } from '@app/store';

const NodeList: React.FunctionComponent = () => {
  const { t } = useTranslation(['node', 'common']);
  const [fetchList, setFetchList] = useState(false);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const history = useHistory();
  const [alertList, setAlertList] = useState<alertList>([]);
  const [currentNode, setCurrentNode] = useState();
  const dispatch = useDispatch<Dispatch>();

  // useEffect(() => {
  //   dispatch.node.getNodeList({ page: 1, pageSize: 10 });
  // }, [dispatch.node]);

  // handle batch delete or lost
  const batchSuccessHandler = useCallback(
    (isBatch) => {
      if (isBatch) {
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
    [setFetchList, fetchList]
  );

  // lost a node
  const { run: lostNode } = useRequest(
    (node, isBatch = false) => ({
      url: `/v1/nodes/${node}/lost`,
      method: 'delete',
    }),
    {
      manual: true,
      onSuccess: (data, params) => {
        console.log(params, 'params');
        // params from useRequest like [node, isBatch]
        batchSuccessHandler(params[1]);
      },
    }
  );

  // delete a node
  const { run: deleteNode } = useRequest(
    (node, isBatch = false) => ({
      url: `/v1/nodes/${node}`,
      method: 'delete',
    }),
    {
      manual: true,
      onSuccess: (data, params) => {
        console.log(params, 'params');
        batchSuccessHandler(params[1]);
      },
    }
  );

  const { loading: updatingNode, run: handleUpdateNode } = useRequest(
    (body) => ({
      url: `/v1/nodes/${currentNode}`,
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
    { title: t('node_name'), cellTransforms: [headerCol()] },
    { title: t('default_ip') },
    { title: t('default_port') },
    { title: t('node_type') },
    { title: t('node_status') },
    { title: '' },
  ];

  const cells = (item) => {
    const net_interface = item.net_interfaces?.find((e) => e.is_active);

    return [
      item?.name,
      net_interface?.address,
      net_interface?.satellite_port,
      item?.type,
      {
        title: (
          <div>
            {item?.connection_status === 'ONLINE' ? (
              <CheckCircleIcon color="green" />
            ) : (
              <ExclamationCircleIcon color="red" />
            )}

            <span> {item?.connection_status}</span>
          </div>
        ),
      },
      { ...item?.props },
    ] as ICell[];
  };

  const listActions = [
    {
      title: t('common:view'),
      onClick: (event, rowId, rowData, extra) => {
        const node = rowData.cells[0];
        history.push(`/inventory/nodes/${node}`);
      },
    },
    {
      title: t('common:property'),
      onClick: (event, rowId, rowData, extra) => {
        const node = rowData.cells[0];
        console.log('clicked on Some action, on row: ', rowData.cells[0]);
        const currentData = omit(rowData.cells[5] ?? {}, 'CurStltConnName');
        console.log(currentData, 'currentData');
        setInitialProps(currentData);
        setPropertyModalOpen(true);
        setCurrentNode(node);
      },
    },
    {
      title: t('common:edit'),
      onClick: (event, rowId, rowData, extra) => {
        const node = rowData.cells[0];
        console.log('clicked on Some action, on row: ', rowData.cells[0]);
        history.push(`/inventory/nodes/edit/${node}`);
      },
    },
    {
      title: t('common:delete'),
      onClick: (event, rowId, rowData, extra) => {
        console.log('clicked on Some action, on row: ', rowData);
        const node = rowData.cells[0];
        deleteNode(node);
      },
    },
    {
      title: t('common:lost'),
      onClick: (event, rowId, rowData, extra) => {
        console.log('clicked on Some action, on row: ', rowData);
        const node = rowData.cells[0];
        lostNode(node);
      },
    },
  ];

  const toolButtons = useMemo(() => {
    return [
      {
        label: t('common:add'),
        variant: 'primary',
        alwaysShow: true,
        onClick: () => history.push('/inventory/nodes/create'),
      },
      {
        label: t('common:delete'),
        variant: 'warning',
        onClick: (selected) => {
          console.log('Will delete', selected);
          const batchDeleteRequests = selected.map((e) => deleteNode(e.cells[0], true));

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
      {
        label: t('common:lost'),
        variant: 'danger',
        onClick: (selected) => {
          console.log('Will lost', selected);
          const batchLostRequests = selected.map((e) => lostNode(e.cells[0], true));

          Promise.all(batchLostRequests).then((res) => {
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
  }, [deleteNode, fetchList, history, lostNode, t]);

  return (
    <PageBasic title={t('node_list')} alerts={alertList}>
      <FilterList
        url="/v1/nodes"
        showFilter
        showSearch
        filerField="connection_status"
        actions={listActions}
        fetchList={fetchList}
        toolButtons={toolButtons}
        columns={columns}
        cells={cells}
        statsUrl="/v1/stats/nodes"
      />
      <PropertyForm
        initialVal={initialProps}
        openStatus={propertyModalOpen}
        type="node"
        handleSubmit={handleUpdateNode}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </PageBasic>
  );
};

export default NodeList;
