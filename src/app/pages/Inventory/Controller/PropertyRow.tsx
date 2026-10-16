// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Tag } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import Button from '@app/components/Button';
import { Input } from '@app/components/Input';
import { InputNumber } from '@app/components/InputNumber';
import { Popconfirm } from '@app/components/Popconfirm';
import { Select } from '@app/components/Select';
import { Switch } from '@app/components/Switch';
import { editorFor, isDefault, isEditable, isSecret, type PropertyInfo } from './properties';

interface PropertyRowProps {
  name: string;
  /** Undefined for a setting shown although nobody set it: its default runs. */
  value?: string;
  info?: PropertyInfo;
  /** Resolves true once the controller accepted the value. */
  onSave: (name: string, value: string) => Promise<boolean>;
  onDelete: (name: string) => void;
  saving: boolean;
}

const MASK = '••••••••••••';

/** One property: its name and description, its value, and editing it in place. */
export const PropertyRow: React.FC<PropertyRowProps> = ({ name, value, info, onSave, onDelete, saving }) => {
  const { t } = useTranslation(['controller', 'common']);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [revealed, setRevealed] = useState(false);

  const editable = isEditable(name, info);
  const secret = isSecret(name);
  const unset = value === undefined;
  const shown = unset ? info?.dflt : value;
  const editor = editorFor(info);

  const startEditing = () => {
    setDraft(shown ?? '');
    setEditing(true);
  };

  const save = async () => {
    if (await onSave(name, draft)) {
      setEditing(false);
    }
  };

  const label = t('controller:value_of', { name });

  const input =
    editor.kind === 'switch' ? (
      <Switch
        aria-label={label}
        checked={draft.toLowerCase() === 'true'}
        onChange={(checked) => setDraft(String(checked))}
      />
    ) : editor.kind === 'select' ? (
      <Select
        aria-label={label}
        className="w-full"
        value={draft || undefined}
        onChange={(v) => setDraft(String(v))}
        options={editor.options.map((o) => ({ label: o, value: o }))}
      />
    ) : editor.kind === 'number' ? (
      <InputNumber
        aria-label={label}
        className="w-full"
        min={editor.min}
        max={editor.max}
        step={editor.float ? 0.1 : 1}
        value={draft === '' ? null : Number(draft)}
        onChange={(v) => setDraft(v === null || v === undefined ? '' : String(v))}
        suffix={info?.unit}
      />
    ) : (
      <Input
        aria-label={label}
        value={draft}
        placeholder={editor.hint}
        onChange={(e) => setDraft(e.target.value)}
        onPressEnter={save}
      />
    );

  return (
    <div
      className={[
        // Narrow: the name on its own line, the value and the buttons below it.
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-t border-(--border-subtle) px-4 py-3 first:border-t-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)_auto] lg:gap-6',
        editing ? 'bg-(--bg-chip-brand)' : '',
      ].join(' ')}
    >
      <div className="col-span-2 min-w-0 lg:col-span-1">
        <div className="font-mono text-[13px] font-medium break-all">{name}</div>
        {info?.info && <div className="mt-0.5 text-[13px] text-(--text-secondary)">{info.info}</div>}
      </div>

      <div className="min-w-0">
        {editing ? (
          input
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                'font-mono text-sm break-all',
                unset ? 'text-(--text-secondary)' : '',
                secret && !revealed ? 'tracking-widest' : '',
              ].join(' ')}
            >
              {secret && !revealed ? MASK : shown}
              {info?.unit && shown !== undefined && !secret ? ` ${info.unit}` : ''}
            </span>
            {secret && (
              <Button type="link" size="small" onClick={() => setRevealed((r) => !r)}>
                {revealed ? t('controller:hide') : t('controller:show')}
              </Button>
            )}
            {(unset || isDefault(value, info)) && (
              <Tag className="m-0" variant="filled">
                {t('controller:default')}
              </Tag>
            )}
          </div>
        )}
      </div>

      <div className="flex min-w-[72px] justify-end gap-1">
        {editing ? (
          <>
            <Button type="text" size="small" onClick={() => setEditing(false)}>
              {t('common:cancel')}
            </Button>
            <Button type="primary" size="small" loading={saving} onClick={save}>
              {t('common:save')}
            </Button>
          </>
        ) : (
          editable && (
            <>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                aria-label={`${t('common:edit')} ${name}`}
                onClick={startEditing}
              />
              {/* An unset setting has nothing to delete; its slot stays, so
                  the edit buttons line up down the list. */}
              {unset ? (
                <span className="inline-block w-6" aria-hidden />
              ) : (
                <Popconfirm
                  title={t('common:delete_property')}
                  description={t('common:are_you_sure_delete_property', { name })}
                  onConfirm={() => onDelete(name)}
                >
                  <Button
                    type="text"
                    size="small"
                    // The colour sits on a wrapper: antd's static message holder adds an
                    // unlayered `.anticon { color: inherit }` that beats one on the icon.
                    icon={
                      <span className="text-(--status-error)">
                        <DeleteOutlined />
                      </span>
                    }
                    aria-label={`${t('common:delete')} ${name}`}
                  />
                </Popconfirm>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};
