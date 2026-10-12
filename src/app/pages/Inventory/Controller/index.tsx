// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMemo, useState } from 'react';
import { Collapse, Empty, Tag } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import Button from '@app/components/Button';
import { Input } from '@app/components/Input';
import PageBasic from '@app/components/PageBasic';
import PropertyForm from '@app/components/PropertyForm';
import { fullySuccess } from '@app/features/requests';
import { getControllerProperties, getControllerPropertiesInfo, updateController } from '@app/features/node';
import { variablesOnly } from '@app/utils/mutation';
import { ControllerActions } from './ControllerActions';
import { ControllerOverview } from './ControllerOverview';
import { PropertyRow } from './PropertyRow';
import {
  COLLAPSED_GROUPS,
  GROUPS,
  SHOWN_WHEN_UNSET,
  groupOf,
  matches,
  type GroupId,
  type PropertyInfo,
} from './properties';

export const Controller = () => {
  const { t } = useTranslation(['controller', 'common']);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<string[]>(GROUPS.filter((g) => !COLLAPSED_GROUPS.includes(g)));

  const { data: properties, refetch } = useQuery({
    queryKey: ['controllerProperties'],
    queryFn: getControllerProperties,
  });

  const { data: propertiesInfo } = useQuery({
    queryKey: ['controllerPropertiesInfo'],
    queryFn: getControllerPropertiesInfo,
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: variablesOnly(updateController),
    onSuccess: () => {
      refetch();
    },
  });

  const values = useMemo(() => (properties?.data ?? {}) as Record<string, string>, [properties]);
  const infos = useMemo(() => (propertiesInfo?.data ?? {}) as Record<string, PropertyInfo>, [propertiesInfo]);

  // What is set, plus the settings shown with their defaults when they are not.
  const groups = useMemo(() => {
    const names = Array.from(new Set([...Object.keys(values), ...SHOWN_WHEN_UNSET.filter((k) => infos[k])])).sort(
      (a, b) => a.localeCompare(b),
    );
    const byGroup = new Map<GroupId, string[]>(GROUPS.map((g) => [g, []]));
    for (const name of names) {
      if (matches(search, name, infos[name])) {
        byGroup.get(groupOf(name))!.push(name);
      }
    }
    return GROUPS.map((id) => ({ id, names: byGroup.get(id)! })).filter((g) => g.names.length > 0);
  }, [values, infos, search]);

  const save = async (name: string, value: string) => {
    const res = await mutation.mutateAsync({ override_props: { [name]: value } }).catch(() => undefined);
    return !!res && fullySuccess(res.data);
  };

  const remove = (name: string) => mutation.mutate({ delete_props: [name] });

  // While searching, every group with a match is open.
  const activeKey = search.trim() ? groups.map((g) => g.id) : open;

  return (
    <PageBasic title={t('common:controller')} extra={<ControllerActions />}>
      <ControllerOverview />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          {t('common:controller_properties')}{' '}
          <span className="font-normal text-(--text-secondary)">{Object.keys(values).length}</span>
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            allowClear
            className="w-[300px] max-w-full"
            aria-label={t('controller:search_label')}
            placeholder={t('controller:search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <PropertyForm initialVal={properties?.data} type="controller" handleSubmit={(data) => mutation.mutate(data)}>
            <Button type="secondary">+ {t('common:add_property')}</Button>
          </PropertyForm>
        </div>
      </div>

      {groups.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('controller:no_match')} />
      ) : (
        <Collapse
          activeKey={activeKey}
          onChange={(keys) => setOpen(Array.isArray(keys) ? keys : [keys])}
          items={groups.map((group) => ({
            key: group.id,
            styles: { body: { padding: 0 } },
            label: (
              <span className="inline-flex flex-wrap items-center gap-3">
                <span className="font-medium">{t(`controller:group_${group.id}`)}</span>
                <Tag className="m-0" variant="filled">
                  {group.names.length}
                </Tag>
              </span>
            ),
            children: group.names.map((name) => (
              <PropertyRow
                key={name}
                name={name}
                value={values[name]}
                info={infos[name]}
                onSave={save}
                onDelete={remove}
                saving={mutation.isPending}
              />
            )),
          }))}
        />
      )}
    </PageBasic>
  );
};
