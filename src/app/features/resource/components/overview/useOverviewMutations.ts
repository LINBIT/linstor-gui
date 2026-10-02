// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { RefObject } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  deleteResourceDefinition,
  updateResourceDefinition,
  UpdateResourceDefinitionRequestBody,
  updateVolumeDefinition,
  VolumeDefinitionModify,
} from '@app/features/resourceDefinition';
import type { PropertyFormRef } from '@app/components/PropertyForm';
import { useDeleteAction } from '@app/hooks/useDeleteAction';
import { variablesOnly } from '@app/utils/mutation';
import { adjustResourceGroup, deleteResource, resourceMigration, resourceModify, toggleResource } from '../../api';
import { ResourceModifyRequestBody } from '../../types';
import { resourceKey } from './rows';
import type { OverviewRow, OverviewVolume } from './types';

interface OverviewMutationsOptions {
  refetch: () => void;
  reloadAll: () => Promise<unknown>;
  /** The definition a row menu acted on, and the deployed resource a sub-row menu acted on. */
  currentDefinition?: OverviewRow;
  currentResource?: { resource_name?: string; node_name?: string };
  rdPropertyFormRef: RefObject<PropertyFormRef | null>;
  vdPropertyFormRef: RefObject<PropertyFormRef | null>;
  resourcePropertyFormRef: RefObject<PropertyFormRef | null>;
}

/** Everything the overview's menus and property forms change on the controller. */
export const useOverviewMutations = ({
  refetch,
  reloadAll,
  currentDefinition,
  currentResource,
  rdPropertyFormRef,
  vdPropertyFormRef,
  resourcePropertyFormRef,
}: OverviewMutationsOptions) => {
  const migrateResourceMutation = useMutation({
    mutationFn: variablesOnly(resourceMigration),
  });

  const adjustResourceGroupMutation = useMutation({
    mutationKey: ['adjustResourceGroupMutation'],
    mutationFn: variablesOnly(adjustResourceGroup),
    onSuccess: () => {
      refetch();
    },
  });

  const toggleResourceMutation = useMutation({
    mutationKey: ['toggleResourceMutation'],
    mutationFn: (data: { resource: string; node: string; action: 'to_diskless' | 'to_diskful' }) => {
      const { resource, node, action } = data;
      return toggleResource(resource, node, action);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const delResource = useDeleteAction<OverviewVolume>({
    remove: (vol) => deleteResource(vol.resource_name ?? '', vol.node_name ?? ''),
    keyOf: resourceKey,
    nameOf: (vol) => `${vol.resource_name ?? ''} on ${vol.node_name ?? ''}`,
    refresh: reloadAll,
  });

  const updateResourceMutation = useMutation({
    mutationKey: ['resourceModify'],
    mutationFn: (data: ResourceModifyRequestBody) => {
      return resourceModify(currentResource?.resource_name ?? '', currentResource?.node_name ?? '', data);
    },
    onSuccess: () => {
      resourcePropertyFormRef.current?.closeModal();
      refetch();
    },
  });

  const updateResourceDefinitionMutation = useMutation({
    mutationKey: ['updateResourceDefinition'],
    mutationFn: (data: UpdateResourceDefinitionRequestBody) =>
      updateResourceDefinition(currentDefinition?.name ?? '', data),
    onSuccess: () => {
      rdPropertyFormRef.current?.closeModal();
      refetch();
    },
  });

  const updateVolumeDefinitionMutation = useMutation({
    mutationKey: ['updateVolumeDefinition'],
    mutationFn: (data: VolumeDefinitionModify) => updateVolumeDefinition(currentDefinition?.name ?? '', 0, data),
    onSuccess: () => {
      vdPropertyFormRef.current?.closeModal();
      refetch();
    },
  });

  const delDefinition = useDeleteAction<OverviewRow>({
    remove: (rd) => deleteResourceDefinition(rd.name ?? ''),
    keyOf: (rd) => rd.name ?? '',
    nameOf: (rd) => rd.name ?? '',
    refresh: reloadAll,
  });

  return {
    migrateResourceMutation,
    adjustResourceGroupMutation,
    toggleResourceMutation,
    updateResourceMutation,
    updateResourceDefinitionMutation,
    updateVolumeDefinitionMutation,
    delResource,
    delDefinition,
  };
};
