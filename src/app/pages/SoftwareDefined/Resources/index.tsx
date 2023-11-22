import React, { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { headerCol, ICell } from '@patternfly/react-table';
import get from 'lodash.get';

import FilterList from '@app/components/FilterList';
import PageBasic from '@app/components/PageBasic';
import { ResourceListType } from '@app/interfaces/resource';
import { formatTime } from '@app/utils/time';
import PropertyForm from '@app/components/PropertyForm';
import service from '@app/requests';
import { useDispatch } from 'react-redux';
import { Dispatch } from '@app/store';
import { Button, Modal, ModalVariant, TextInput } from '@patternfly/react-core';
import { notify, notifyList } from '@app/utils/toast';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['resource', 'common']);
  const [fetchList, setFetchList] = useState(false);
  const history = useHistory();
  const dispatch = useDispatch<Dispatch>();

  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const [current, setCurrent] = useState();
  const [currentNode, setCurrentNode] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<string>();
  const [snapshotName, setSnapshotName] = useState<string>('');

  const { run: deleteResource } = useRequest(
    (resource, node, _isBatch = false) => ({
      url: `/v1/resource-definitions/${resource}/resources/${node}`,
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

  const { run: handleUpdateResourceProps } = useRequest(
    (body) => ({
      url: `/v1/resource-definitions/${current}/resources/${currentNode}`,
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

  const handleConnectStatusDisplay = useCallback((resourceItem: ResourceListType[0]) => {
    let failStr = '';
    const conn = get(resourceItem, 'layer_object.drbd.connections', {});
    let count = 0;
    let fail = false;
    for (const nodeName in conn) {
      count++;
      if (!conn[nodeName].connected) {
        fail = true;
        if (failStr !== '') {
          failStr += ',';
        }
        failStr += `${nodeName} ${conn[nodeName].message}`;
      }
    }
    fail = count === 0 ? true : fail;
    failStr = fail ? failStr : 'CONNECTED'; // TODO: i18n
    return failStr;
  }, []);

  const getVolumeCellState = (vlm_state, rsc_flags, vlm_flags) => {
    const state_prefix = vlm_flags.indexOf('RESIZE') > -1 ? 'Resizing, ' : '';
    let state = state_prefix + 'Unknown';
    if (vlm_state && vlm_state.disk_state) {
      const disk_state = vlm_state.disk_state;
      if (disk_state == 'DUnknown') {
        state = state_prefix + 'Unknown';
      } else if (disk_state == 'Diskless') {
        if (!rsc_flags.includes('DISKLESS')) {
          state = state_prefix + disk_state;
        } else if (rsc_flags.includes('TIE_BREAKER')) {
          state = 'TieBreaker';
        } else {
          state = state_prefix + disk_state;
        }
      } else {
        state = state_prefix + disk_state;
      }
    }
    return state;
  };

  const handleResourceStateDisplay = useCallback((resourceItem: ResourceListType[0]) => {
    let stateStr = 'Unknown';
    const flags = resourceItem.flags || [];
    const rsc_state_obj = resourceItem.state || {};
    const volumes = resourceItem.volumes || [];

    if (flags.includes('DELETE')) {
      stateStr = 'DELETING';
    } else if (flags.includes('INACTIVE')) {
      stateStr = 'INACTIVE';
    } else if (rsc_state_obj) {
      if (typeof rsc_state_obj.in_use !== 'undefined') {
        for (let i = 0; i < volumes.length; ++i) {
          const volume = volumes[i];
          const vlm_state = volume.state || {};
          const vlm_flags = volume.flags || [];
          stateStr = getVolumeCellState(vlm_state, flags, vlm_flags);

          if (flags.includes('EVACUATE')) {
            stateStr += ', Evacuating';
          }
        }
      }
    }

    return stateStr;
  }, []);

  const columns = [
    { title: t('resource_name'), cellTransforms: [headerCol()] },
    { title: t('resource_node') },
    { title: t('resource_port') },
    { title: t('resource_usage') },
    { title: t('resource_conn') },
    { title: t('resource_state') },
    { title: t('resource_create_time') },
    { title: '' },
  ];

  const cells = (cell: unknown) => {
    const item = cell as ResourceListType[0];
    const props = item.props ?? {};
    return [
      item.name,
      item.node_name,
      get(item, 'layer_object.drbd.drbd_resource_definition.port'),
      get(item, 'state.in_use', false) ? 'InUse' : 'Unused', // TODO: i18n
      handleConnectStatusDisplay(item),
      handleResourceStateDisplay(item),
      formatTime(item.create_timestamp),
      props,
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
        setPropertyModalOpen(true);
        setCurrent(resource);
        setCurrentNode(node);
      },
    },
    {
      title: t('common:snapshot'),
      onClick: async (event, rowId, rowData, extra) => {
        const resource = rowData.cells[0];
        setIsModalOpen(true);
        setCurrentResource(resource);
      },
    },
    {
      title: t('common:edit'),
      onClick: (event, rowId, rowData, extra) => {
        const resource = rowData.cells[0];
        history.push(`/storage-configuration/resources/${resource}/edit`);
      },
    },
    {
      title: t('common:delete'),
      onClick: async (event, rowId, rowData, extra) => {
        const node = rowData.cells[1];
        const resource = rowData.cells[0];
      },
    },
  ];

  const toolButtons = useMemo(() => {
    return [
      {
        label: t('common:add'),
        variant: 'primary',
        alwaysShow: true,
        onClick: () => history.push('/storage-configuration/resources/create'),
      },
      {
        label: t('common:delete'),
        variant: 'danger',
        onClick: (selected) => {
          const batchDeleteRequests = selected.map((e) => deleteResource(e.cells[0], e.cells[1], true));

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
  }, [deleteResource, fetchList, history, t]);

  const handleCreateSnapShot = async () => {
    if (currentResource && snapshotName != '') {
      await dispatch.snapshot.createSnapshot({ resource: currentResource, name: snapshotName });
      setIsModalOpen(false);
      setSnapshotName('');
    }
  };

  return (
    <PageBasic title={t('list')}>
      <FilterList
        showSearch
        url="/v1/view/resources"
        actions={listActions}
        fetchList={fetchList}
        toolButtons={toolButtons}
        columns={columns}
        cells={cells}
        statsUrl="/v1/stats/resources"
      />
      <PropertyForm
        initialVal={initialProps}
        openStatus={propertyModalOpen}
        type="resource"
        handleSubmit={handleUpdateResourceProps}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
      <Modal
        variant={ModalVariant.medium}
        title="Create Snapshot"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actions={[
          <Button key="confirm" variant="primary" onClick={handleCreateSnapShot}>
            Confirm
          </Button>,
          <Button key="cancel" variant="link" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>,
        ]}
      >
        <TextInput
          isRequired
          type="text"
          id="simple-form-number-01"
          placeholder="Input snapshot name"
          name="simple-form-number-01"
          value={snapshotName}
          onChange={(text) => {
            setSnapshotName(text);
          }}
        />
      </Modal>
    </PageBasic>
  );
};

export default List;
