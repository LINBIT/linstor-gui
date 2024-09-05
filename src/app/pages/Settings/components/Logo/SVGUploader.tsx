import React, { useEffect } from 'react';
import { Button, FileUpload } from '@patternfly/react-core';
import SVG from 'react-inlinesvg';
import isSvg from 'is-svg';

import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, RootState } from '@app/store';
import { Form, Switch, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export const SVGFileUpload: React.FunctionComponent = () => {
  const [value, setValue] = React.useState('');
  const [form] = Form.useForm();

  const { logoSrc, customLogoEnabled } = useSelector((state: RootState) => ({
    logoSrc: state.setting.logo,
    customLogoEnabled: state.setting.KVS?.customLogoEnabled,
  }));

  const dispatch = useDispatch<Dispatch>();

  const handleSave = () => {
    const values = form.getFieldsValue(['customLogoEnabled']);

    if (!values.customLogoEnabled) {
      dispatch.setting.disableCustomLogo();
    } else if (isSvg(value)) {
      dispatch.setting.setLogo({
        logoSvg: value,
      });
    }
  };

  useEffect(() => {
    if (customLogoEnabled) {
      form.setFieldValue('customLogoEnabled', customLogoEnabled);
    }
  }, [customLogoEnabled, form]);

  return (
    <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} layout="horizontal" style={{ maxWidth: 400 }} form={form}>
      <Form.Item label="Custom Logo" valuePropName="checked" name="customLogoEnabled">
        <Switch />
      </Form.Item>

      {logoSrc && (
        <Form.Item label="Current Logo">
          <div>{isSvg(String(logoSrc)) ? <SVG src={logoSrc || ''} width="80" height="80" /> : null}</div>
        </Form.Item>
      )}

      <Form.Item label="New Logo" valuePropName="fileList">
        <Upload
          listType="picture-card"
          maxCount={1}
          beforeUpload={(file) => {
            if (file.size > 16 * 1024) {
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
            <div style={{ marginTop: 8 }}>Upload</div>
          </button>
        </Upload>
      </Form.Item>
      <Form.Item wrapperCol={{ span: 4, offset: 6 }}>
        <Button onClick={handleSave}>Save</Button>
      </Form.Item>
    </Form>
  );
};

export default SVGFileUpload;
