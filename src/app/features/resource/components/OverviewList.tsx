// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useCallback, useMemo, useRef, useState } from 'react';
import { Form, Table } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { uniqId } from '@app/utils/stringUtils';
import { ResizeVolumeModal } from '@app/features/resourceDefinition';
import { useWidth } from '@app/hooks';
import PropertyForm from '@app/components/PropertyForm';
import { PropertyFormRef } from '@app/components/PropertyForm';
import { useSettings } from '@app/features/settings/useSettings';
import { UIMode } from '@app/features/settings/types';
import { deletingRowClass } from '@app/hooks/useDeleteAction';

import { AddToNodeModal } from './AddToNodeModal';
import { ResourceMigrateForm } from './ResourceMigrateForm';
import './OverviewList.css';
import { filterResourceList } from './filterResourceList';
import { auxPropKeys, resourceKey } from './overview/rows';
import type { OverviewRow } from './overview/types';
import { useOverviewData } from './overview/useOverviewData';
import { useOverviewMutations } from './overview/useOverviewMutations';
import { useDefinitionColumns, withAuxColumns } from './overview/useDefinitionColumns';
import { NodeVolumesTable } from './overview/NodeVolumesTable';
import { OverviewToolbar } from './overview/OverviewToolbar';
import { CreateSnapshotModal } from './overview/CreateSnapshotModal';
import { useUrlQuery } from './overview/useUrlQuery';

export const OverviewList = () => {
  // The definition a row menu acted on, and the deployed resource a sub-row
  // menu acted on; the property forms and the resize modal read these.
  const [currentDefinition, setCurrentDefinition] = useState<OverviewRow>();
  const [currentResource_, setCurrentResource_] = useState<{ resource_name?: string; node_name?: string }>();
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();

  const rdPropertyFormRef = useRef<PropertyFormRef>(null);
  const vdPropertyFormRef = useRef<PropertyFormRef>(null);
  const resourcePropertyFormRef = useRef<PropertyFormRef>(null);

  const [searchKey, setSearchKey] = useState<string>('');
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resizeModalOpen, setResizeModalOpen] = useState(false);
  const [migrateModalOpen, setMigrateModalOpen] = useState(false);
  const [addToNodeModalOpen, setAddToNodeModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<string>();
  const [usedNodes, setUsedNodes] = useState<string[]>([]);
  const [migrationInfo, setMigrationInfo] = useState<{
    resource: string;
    node: string;
  }>({
    resource: '',
    node: '',
  });

  const { width } = useWidth();

  const isLargeScreen = width >= 1080;

  const [form] = Form.useForm();
  const resource_group = Form.useWatch('resource_group', form);

  const { t } = useTranslation(['volume', 'common']);

  const [query, setQuery] = useUrlQuery(form, setSearchKey);

  const { mode } = useSettings();
  const navigate = useNavigate();

  const { resourceDefinitionList, isPending, refetch, reloadAll } = useOverviewData(query);

  const filteredList = useMemo(
    () => filterResourceList(resourceDefinitionList, resource_group, searchKey),
    [resourceDefinitionList, resource_group, searchKey],
  );

  const {
    migrateResourceMutation,
    adjustResourceGroupMutation,
    toggleResourceMutation,
    updateResourceMutation,
    updateResourceDefinitionMutation,
    updateVolumeDefinitionMutation,
    delResource,
    delDefinition,
  } = useOverviewMutations({
    refetch,
    reloadAll,
    currentDefinition,
    currentResource: currentResource_,
    rdPropertyFormRef,
    vdPropertyFormRef,
    resourcePropertyFormRef,
  });

  const handleMigrate = async (val: { node: string }) => {
    const res = await migrateResourceMutation.mutateAsync({
      resource: migrationInfo.resource,
      fromnode: migrationInfo.node,
      node: val.node,
    });

    if (res.data) {
      setMigrateModalOpen(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({
      resource_definitions: undefined,
    });

    setSearchKey('');
    refetch();
  };

  const columns = useDefinitionColumns(mode, {
    onEdit: (record) =>
      navigate(
        `${mode === UIMode.HCI ? '/hci' : ''}/storage-configuration/resource-definitions/${encodeURIComponent(record.name ?? '')}/edit`,
      ),
    onAddToNode: (record) => {
      setCurrentResource(record.name);
      const nodes = record.volumes?.map((v) => v.node_name) || [];
      setUsedNodes(Array.from(new Set(nodes.filter((n): n is string => Boolean(n)))));
      setAddToNodeModalOpen(true);
    },
    onAdjust: (record) => adjustResourceGroupMutation.mutate({ resource_group: record.resource_group_name ?? '' }),
    onResize: (record) => {
      setCurrentDefinition(record);
      setResizeModalOpen(true);
    },
    onDefinitionProperties: (record) => {
      setCurrentDefinition(record);
      setInitialProps(record.props ?? {});
      rdPropertyFormRef.current?.openModal();
    },
    onVolumeDefinitionProperties: (record) => {
      setCurrentDefinition(record);
      setInitialProps(record.volumeDefinitions[0]?.props ?? {});
      vdPropertyFormRef.current?.openModal();
    },
    onDelete: (record) => delDefinition.run([record]),
  });

  const handlePaginationChange = useCallback((pagination: TablePaginationConfig) => {
    setPagination(pagination);
  }, []);

  // Aux/* properties get a column of their own when a row on this page has one.
  // Built every render like `columns`; the memos that used to wrap these never
  // held, since their inputs are new objects each time.
  const pageSize = pagination.pageSize ?? 10;
  const currentPage = pagination.current ?? 1;
  const currentData = filteredList?.slice(pageSize * (currentPage - 1), pageSize * currentPage);
  const finalColumns = withAuxColumns(columns, auxPropKeys(resourceDefinitionList), currentData, isLargeScreen);

  const tablePagination = useMemo(() => {
    return {
      showSizeChanger: true,
      showQuickJumper: true,
      pageSizeOptions: ['10', '20', '50', '100', '200'],
      showTotal: (total: number) => t('common:total_items', { total }),
    };
  }, [t]);

  const expandableRender = (record: OverviewRow) => (
    <NodeVolumesTable
      volumes={record.volumes ?? []}
      isDeleting={(vol) => delResource.isDeleting(resourceKey(vol))}
      onToggleDisk={(vol, action) =>
        toggleResourceMutation.mutate({ resource: vol.resource_name ?? '', node: vol.node_name ?? '', action })
      }
      onProperties={(vol) => {
        setCurrentResource_({
          resource_name: vol.resource_name,
          node_name: vol.node_name,
        });

        const currentData = vol?.resource.props;
        setInitialProps({
          ...currentData,
          name: vol?.resource_name,
        });
        resourcePropertyFormRef.current?.openModal();
      }}
      onSnapshot={(resource) => {
        setIsModalOpen(true);
        setCurrentResource(resource);
      }}
      onMigrate={(resource, node) => {
        setMigrateModalOpen(true);
        setMigrationInfo({ resource, node });
      }}
      onDelete={(vol) => delResource.run([vol])}
    />
  );

  return (
    <div className="overflow-x-auto relative">
      <OverviewToolbar
        form={form}
        rows={resourceDefinitionList}
        mode={mode}
        onSearch={setSearchKey}
        onReset={handleReset}
        refetch={refetch}
      />

      <br />

      <Table
        loading={isPending}
        columns={finalColumns}
        expandable={{
          // The expand column's header, for screen readers (antd leaves it empty).
          columnTitle: <span className="sr-only">{t('common:detail')}</span>,
          expandedRowRender: expandableRender,
          rowExpandable: (record) => (record?.volumes?.length ?? 0) > 0,
        }}
        dataSource={filteredList}
        rowKey={(item) => item?.name ?? uniqId()}
        rowClassName={(item) => (delDefinition.isDeleting(item.name ?? '') ? deletingRowClass : '')}
        pagination={tablePagination}
        onChange={handlePaginationChange}
        scroll={{ x: 'max-content' }}
      />

      <PropertyForm
        ref={rdPropertyFormRef}
        initialVal={initialProps}
        type="resource-definition"
        handleSubmit={(data) => updateResourceDefinitionMutation.mutate(data)}
      />

      <PropertyForm
        ref={vdPropertyFormRef}
        initialVal={initialProps}
        type="volume-definition"
        handleSubmit={(data) => updateVolumeDefinitionMutation.mutate(data)}
      />

      <PropertyForm
        ref={resourcePropertyFormRef}
        initialVal={initialProps}
        type="resource"
        handleSubmit={(data) => updateResourceMutation.mutate(data)}
      />

      <AddToNodeModal
        open={addToNodeModalOpen}
        onClose={() => setAddToNodeModalOpen(false)}
        resourceName={currentResource ?? ''}
        usedNodes={usedNodes}
        onSuccess={() => {
          refetch();
        }}
      />

      <ResizeVolumeModal
        open={resizeModalOpen}
        onClose={() => setResizeModalOpen(false)}
        resourceName={currentDefinition?.name ?? ''}
        onSuccess={() => {
          refetch();
        }}
      />

      <CreateSnapshotModal open={isModalOpen} resource={currentResource} onClose={() => setIsModalOpen(false)} />
      <ResourceMigrateForm
        open={migrateModalOpen}
        migrationInfo={migrationInfo}
        onCancel={() => {
          setMigrateModalOpen(false);
        }}
        onCreate={handleMigrate}
      />
    </div>
  );
};
