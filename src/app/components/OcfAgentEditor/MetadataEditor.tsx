import React, { useEffect, useRef } from 'react';
import { Form, Input, Card, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from '@app/components/Button';

interface MetadataEditorProps {
  initialValues: Record<string, string | number | boolean>;
  onValuesChange: (values: Record<string, string | number | boolean>) => void;
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({ initialValues, onValuesChange }) => {
  const [form] = Form.useForm();
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    // Transform object to array for Form.List
    const fields = Object.entries(initialValues).map(([key, value]) => ({ key, value }));
    form.setFieldsValue({ metadata: fields });
  }, [initialValues, form]);

  const handleValuesChange = (_: any, allValues: any) => {
    isInternalUpdate.current = true;
    // Transform array back to object
    const metadataObj: Record<string, string | number | boolean> = {};
    if (allValues.metadata) {
      allValues.metadata.forEach((item: { key: string; value: any }) => {
        if (item && item.key) {
          metadataObj[item.key] = item.value;
        }
      });
    }
    onValuesChange(metadataObj);
  };

  return (
    <Card bordered={false} bodyStyle={{ padding: '24px' }}>
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange} autoComplete="off">
        <Form.List name="metadata">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...restField} name={[name, 'key']} rules={[{ required: true, message: 'Missing key' }]}>
                    <Input placeholder="Key" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'value']}
                    rules={[{ required: true, message: 'Missing value' }]}
                  >
                    <Input placeholder="Value" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add({ key: '', value: '' })} block icon={<PlusOutlined />}>
                  Add Metadata
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Card>
  );
};
