// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMemo, useState } from 'react';
import { Collapse, Empty, Skeleton } from 'antd';
import { Tag } from '@app/components/Tag';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import Button from '@app/components/Button';
import { Input } from '@app/components/Input';
import PageBasic from '@app/components/PageBasic';
import PropertyForm from '@app/components/PropertyForm';
import { fullySuccess } from '@app/features/requests';
import { getControllerProperties, getControllerPropertiesInfo, updateController } from '@app/features/node';
import { variablesOnly } from '@app/utils/mutation';
import { ControllerOverview } from './ControllerOverview';
import { PropertyRow } from './PropertyRow';
import {
  AUX_GROUP,
  COLLAPSED_GROUPS,
  OTHER_GROUP,
  SHOWN_WHEN_UNSET,
  compareGroups,
  groupOf,
  matches,
  type GroupId,
  type PropertyInfo,
} from './properties';

export const Controller = () => {
  const { t } = useTranslation(['controller', 'common']);
  const [search, setSearch] = useState('');
  // The groups come from the properties, so remember the closed ones: a new group starts open.
  const [closed, setClosed] = useState<GroupId[]>(COLLAPSED_GROUPS);

  const {
    data: properties,
    isPending: propertiesPending,
    refetch,
  } = useQuery({
    queryKey: ['controllerProperties'],
    queryFn: getControllerProperties,
  });

  const { data: propertiesInfo, isPending: infoPending } = useQuery({
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
    const byGroup = new Map<GroupId, string[]>();
    for (const name of names) {
      if (matches(search, name, infos[name])) {
        const id = groupOf(name);
        byGroup.set(id, [...(byGroup.get(id) ?? []), name]);
      }
    }
    return Array.from(byGroup.keys())
      .sort(compareGroups)
      .map((id) => ({ id, names: byGroup.get(id)! }));
  }, [values, infos, search]);

  const save = async (name: string, value: string) => {
    const res = await mutation.mutateAsync({ override_props: { [name]: value } }).catch(() => undefined);
    return !!res && fullySuccess(res.data);
  };

  const remove = (name: string) => mutation.mutate({ delete_props: [name] });

  // The rows show what the controller documents about each property.
  const loading = propertiesPending || infoPending;

  // While searching, every group with a match is open.
  const shown = groups.map((g) => g.id);
  const activeKey = search.trim() ? shown : shown.filter((id) => !closed.includes(id));

  const onCollapse = (keys: string | string[]) => {
    const open = Array.isArray(keys) ? keys : [keys];
    setClosed((prev) => [...prev.filter((id) => !shown.includes(id)), ...shown.filter((id) => !open.includes(id))]);
  };

  const groupLabel = (id: GroupId) =>
    id === AUX_GROUP ? t('controller:group_aux') : id === OTHER_GROUP ? t('controller:group_other') : id;

  return (
    <PageBasic title={t('common:controller')}>
      <ControllerOverview />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          {t('common:controller_properties')}{' '}
          {!loading && <span className="font-normal text-(--text-secondary)">{Object.keys(values).length}</span>}
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

      {loading ? (
        <div aria-busy="true" className="rounded-lg border border-(--border-subtle)">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="border-t border-(--border-subtle) px-4 py-3 first:border-t-0">
              <Skeleton active title={{ width: '40%' }} paragraph={{ rows: 1, width: '70%' }} />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('controller:no_match')} />
      ) : (
        <Collapse
          activeKey={activeKey}
          onChange={onCollapse}
          items={groups.map((group) => ({
            key: group.id,
            styles: { body: { padding: 0 } },
            label: (
              <span className="inline-flex flex-wrap items-center gap-3">
                <span className="font-medium">{groupLabel(group.id)}</span>
                <Tag className="m-0">{group.names.length}</Tag>
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
