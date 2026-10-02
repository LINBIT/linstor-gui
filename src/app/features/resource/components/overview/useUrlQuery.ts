// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
import type { FormInstance } from 'antd';
import { useLocation } from 'react-router-dom';
import type { ResourceDefinitionListQuery } from '@app/features/resourceDefinition';

/**
 * The definition query, seeded from the URL: `?resource-definitions=a,b` asks
 * the controller for those, `?resource=x` only fills the name search.
 */
export const useUrlQuery = (form: FormInstance, setSearchKey: (value: string) => void) => {
  const location = useLocation();

  return useState<ResourceDefinitionListQuery>(() => {
    const query = new URLSearchParams(location.search);
    const resource_definitions = query.get('resource-definitions')?.split(',');
    const resource = query.get('resource');

    const queryO: ResourceDefinitionListQuery = {};

    if (resource_definitions) {
      form.setFieldValue('name', resource_definitions);
      queryO['resource_definitions'] = resource_definitions;
    }

    if (resource) {
      form.setFieldValue('name', resource);
      setSearchKey(resource);
    }

    return {
      resource_definitions,
    };
  });
};
