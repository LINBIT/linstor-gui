// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Form, Space, Dropdown, Tooltip } from 'antd';
import type { FormInstance } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { uniqBy } from 'lodash';
import { DownOutlined, QuestionCircleOutlined } from '@ant-design/icons';

import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';
import { Button } from '@app/components/Button';
import { SearchForm } from '@app/components/SearchForm';
import { CreateForm } from '@app/features/volumeDefinition';
import { SpawnForm } from '@app/features/resourceGroup/components/SpawnForm';
import { UIMode } from '@app/features/settings/types';
import type { OverviewRow } from './types';

interface OverviewToolbarProps {
  form: FormInstance;
  rows: OverviewRow[] | undefined;
  mode?: UIMode;
  onSearch: (value: string) => void;
  onReset: () => void;
  refetch: () => void;
}

/** Name search and resource group filter on the left, the create actions on the right. */
export const OverviewToolbar: React.FC<OverviewToolbarProps> = ({ form, rows, mode, onSearch, onReset, refetch }) => {
  const { t } = useTranslation(['volume', 'common']);
  const navigate = useNavigate();

  return (
    <SearchForm>
      <Form form={form} name="storage_pool_search" layout="inline">
        <Form.Item
          name="name"
          label={
            <>
              {t('common:name')}
              <Tooltip title={t('resource:search_placeholder')}>
                <QuestionCircleOutlined style={{ marginLeft: 5 }} />
              </Tooltip>
            </>
          }
        >
          <Input
            placeholder={t('resource:search_placeholder')}
            onChange={(e) => onSearch(e.target.value)}
            onPressEnter={(e) => onSearch(e.currentTarget.value)}
          />
        </Form.Item>

        <Form.Item name="resource_group" label={t('common:resource_group')}>
          <Select
            showSearch
            allowClear
            style={{ width: 200 }}
            options={uniqBy(
              rows?.map((e) => ({
                label: e.resource_group_name,
                value: e.resource_group_name,
              })) || [],
              'value',
            )}
            placeholder={t('common:select_resource_group')}
          />
        </Form.Item>

        <Form.Item>
          <Space size="small">
            <Button type="secondary" onClick={onReset}>
              {t('common:reset')}
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Space>
        {/* Quick path: spawn a fully-deployed resource from a resource group. */}
        <SpawnForm />

        {/* Advanced path: create the Resource Definition / Volume Definition /
            Resource by hand. */}
        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: `${t('common:create')} ${t('common:resource_definition')}`,
                onClick: () => {
                  navigate(
                    mode === UIMode.HCI
                      ? `/hci/storage-configuration/resource-definitions/create`
                      : `/storage-configuration/resource-definitions/create`,
                  );
                },
              },
              {
                key: '2',
                label: <CreateForm refetch={refetch} simple />,
              },
              {
                key: '3',
                label: `${t('common:create')} ${t('common:resource')}`,
                onClick: () => {
                  navigate(
                    mode === UIMode.HCI
                      ? `/hci/storage-configuration/resources/create`
                      : `/storage-configuration/resources/create`,
                  );
                },
              },
            ],
          }}
          placement="bottomRight"
        >
          <Button type="secondary">
            {t('common:advanced')} <DownOutlined />
          </Button>
        </Dropdown>
      </Space>
    </SearchForm>
  );
};
