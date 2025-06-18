// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Form, Switch, Upload, Button, Input, message } from 'antd';
import SVG from 'react-inlinesvg';
import isSvg from 'is-svg';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, RootState } from '@app/store';
import { isUrl } from '@app/utils/stringUtils';
import { useTranslation } from 'react-i18next';

type FormType = {
  customLogoEnabled: boolean;
  URL: string;
};

export const SVGFileUpload: React.FunctionComponent = () => {
  const [value, setValue] = React.useState('');
  const [form] = Form.useForm();
  const { t } = useTranslation(['common', 'settings']);

  const { logoSrc, customLogoEnabled } = useSelector((state: RootState) => ({
    logoSrc: state.setting.logo,
    customLogoEnabled: state.setting.KVS?.customLogoEnabled,
  }));

  const customLogoEnabledFromForm = Form.useWatch(['customLogoEnabled'], form);

  const dispatch = useDispatch<Dispatch>();

  const handleSave = () => {
    const values = form.getFieldsValue(['customLogoEnabled', 'URL']);

    if (!values.customLogoEnabled) {
      dispatch.setting.disableCustomLogo();
    } else if (values.URL) {
      dispatch.setting.setLogo({
        logoSvg: '',
        logoUrl: values.URL,
      });
    } else if (isSvg(value)) {
      dispatch.setting.setLogo({
        logoSvg: value,
      });
    }
  };

  useEffect(() => {
    if (customLogoEnabled) {
      form.setFieldValue('customLogoEnabled', customLogoEnabled);
      if (isUrl(logoSrc)) {
        form.setFieldsValue({ URL: logoSrc });
      }
    }
  }, [customLogoEnabled, form, logoSrc]);

  const renderLogo = (logoSrc: string) => {
    // if the logo is a URL and not an SVG, render the URL
    if (isUrl(logoSrc) && !isSvg(logoSrc)) {
      return <img src={logoSrc} alt="logo" width={80} height={80} />;
    }
    // if the logo is an SVG, render the SVG
    if (isSvg(logoSrc)) {
      return <div>{isSvg(String(logoSrc)) ? <SVG src={logoSrc || ''} width="80" height="80" /> : null}</div>;
    }
    return null;
  };

  return (
    <Form<FormType>
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      layout="horizontal"
      style={{ maxWidth: 600 }}
      form={form}
    >
      <Form.Item
        label={t('settings:custom_logo')}
        valuePropName="checked"
        name="customLogoEnabled"
        extra={t('settings:custom_logo_description')}
      >
        <Switch />
      </Form.Item>

      {customLogoEnabledFromForm && (
        <>
          {logoSrc && <Form.Item label="Current Logo">{renderLogo(logoSrc)}</Form.Item>}

          <Form.Item label={t('settings:logo')} valuePropName="fileList">
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={(file) => {
                if (file.size > 16 * 1024) {
                  form.setFields([
                    {
                      name: 'customLogoEnabled',
                      errors: [t('settings:logo_size_error')],
                    },
                  ]);
                  message.error(t('settings:logo_size_error'));
                  return false;
                }
                const reader = new FileReader();

                reader.onload = function (event) {
                  const fileContent = event?.target?.result;
                  setValue(fileContent as string);
                };

                reader.readAsText(file);

                return false;
              }}
              accept=".svg"
            >
              <button style={{ border: 0, background: 'none' }} type="button">
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>{t('common:upload')}</div>
              </button>
            </Upload>
          </Form.Item>
          <Form.Item label={t('settings:url')} name="URL">
            <Input placeholder="https://example.com/logo.svg" />
          </Form.Item>
        </>
      )}

      <Form.Item wrapperCol={{ span: 4, offset: 6 }}>
        <Button onClick={handleSave}>{t('common:save')}</Button>
      </Form.Item>
    </Form>
  );
};

export default SVGFileUpload;
