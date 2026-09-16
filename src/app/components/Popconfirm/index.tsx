// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover } from 'antd';
import type { PopoverProps } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import { Button, type ButtonProps } from '@app/components/Button';

/**
 * Drop-in replacement for antd's Popconfirm that renders its confirm/cancel
 * actions with the project Button component (LINBIT brand styling) instead of
 * antd's default buttons. antd's Popconfirm exposes no way to override the
 * button components, so this wraps a Popover with custom content.
 *
 * The prop names mirror antd's PopconfirmProps so existing usages only need to
 * swap the import. okText/cancelText default to the translated yes/no, so call
 * sites do not have to repeat them — and cannot hardcode them in English.
 */
export interface PopconfirmProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okType?: 'primary' | 'default' | 'dashed' | 'link' | 'text' | 'danger';
  okButtonProps?: AntButtonProps;
  cancelButtonProps?: AntButtonProps;
  icon?: React.ReactNode;
  disabled?: boolean;
  placement?: PopoverProps['placement'];
  onConfirm?: (e?: React.MouseEvent<HTMLElement>) => void | Promise<void>;
  onCancel?: (e?: React.MouseEvent<HTMLElement>) => void;
  getPopupContainer?: PopoverProps['getPopupContainer'];
  overlayClassName?: string;
  children?: React.ReactNode;
}

export const Popconfirm: React.FC<PopconfirmProps> = ({
  title,
  description,
  okText,
  cancelText,
  okType,
  okButtonProps,
  cancelButtonProps,
  icon,
  disabled = false,
  placement = 'top',
  onConfirm,
  onCancel,
  getPopupContainer,
  overlayClassName,
  children,
}) => {
  const { t } = useTranslation(['common']);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (e: React.MouseEvent<HTMLElement>) => {
    try {
      setLoading(true);
      await onConfirm?.(e);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (e: React.MouseEvent<HTMLElement>) => {
    onCancel?.(e);
    setOpen(false);
  };

  const content = (
    <div style={{ maxWidth: 260 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 2 }}>
          {icon ?? <ExclamationCircleFilled style={{ color: '#faad14' }} />}
        </span>
        <div>
          {title && <div style={{ fontWeight: 600 }}>{title}</div>}
          {description && <div style={{ marginTop: 4 }}>{description}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <Button size="small" type="secondary" onClick={handleCancel} {...(cancelButtonProps as Partial<ButtonProps>)}>
          {cancelText ?? t('common:no')}
        </Button>
        <Button
          size="small"
          type="primary"
          danger={okType === 'danger' || okButtonProps?.danger}
          loading={loading}
          onClick={handleConfirm}
          {...(okButtonProps as Partial<ButtonProps>)}
        >
          {okText ?? t('common:yes')}
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        if (disabled) return;
        setOpen(value);
      }}
      trigger="click"
      placement={placement}
      content={content}
      getPopupContainer={getPopupContainer}
      overlayClassName={overlayClassName}
    >
      {children}
    </Popover>
  );
};

export default Popconfirm;
