// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { handlePropsToFormOption } from '@app/utils/property';
import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { FormItem } from '@app/interfaces/dynamicFormType';
import { uniqId } from '@app/utils/stringUtils';
import SingleSelectDescription from './PropertySelector';
import { Properties } from '@app/features/property';
import { Button, Checkbox, Form, Input, InputNumber, Modal, Radio, Select, Slider } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

interface PropertyFormProps {
  type:
    | 'controller'
    | 'node'
    | 'storagepool-definition'
    | 'storagepool'
    | 'resource-group'
    | 'resource-definition'
    | 'volume-definition'
    | 'resource'
    | 'volume';
  initialVal?: Record<string, unknown>;
  handleSubmit: (data: { override_props?: Properties; delete_props?: Array<string> }) => void;
  children?: React.ReactNode;
}

export interface PropertyFormRef {
  openModal: () => void;
  closeModal: () => void;
}

type AuxProp = {
  name: string;
  value: string;
  id: string;
};

const PropertyForm = forwardRef<PropertyFormRef, PropertyFormProps>(
  ({ type, initialVal, handleSubmit, children }, ref) => {
    const [formItemList, setFormItemList] = useState<FormItem[]>([]);
    const [formItems, setFormItems] = useState<FormItem[]>([]);
    const [auxProps, setAuxProps] = useState<AuxProp[]>([]);
    const [deleteAll, setDeleteAll] = useState(false);
    const [deleteProps, setDeleteProps] = useState<Array<string>>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentInitialVal, setCurrentInitialVal] = useState<Record<string, unknown> | undefined>();
    const [form] = Form.useForm();

    useImperativeHandle(ref, () => ({
      openModal: () => {
        const currentInitial = initialVal;
        setCurrentInitialVal(currentInitial);

        form.resetFields();
        setDeleteProps([]);
        setDeleteAll(false);

        const nodePropertyList: FormItem[] = handlePropsToFormOption(type, currentInitial);
        const displayItems = nodePropertyList.filter((e) => !e.hide);
        setFormItemList(nodePropertyList);
        setFormItems(displayItems);

        const originalAuxItems: AuxProp[] = [];
        if (currentInitial) {
          for (const propsKey in currentInitial) {
            const strings = propsKey.split('/');
            const first = strings[0];
            if (strings.length > 0 && first === 'Aux') {
              originalAuxItems.push({
                name: strings.slice(1).join('/'),
                value: currentInitial[propsKey] as string,
                id: uniqId(),
              });
            }
          }
        }
        setAuxProps(originalAuxItems);

        setModalVisible(true);

        setTimeout(() => {
          if (currentInitial) {
            const formValues: Record<string, unknown> = {};
            displayItems.forEach((item) => {
              if (!item.hide && item.name in currentInitial) {
                formValues[item.name] = currentInitial[item.name];
              } else if (!item.hide) {
                formValues[item.name] = item.defaultValue;
              }
            });
            form.setFieldsValue(formValues);
          }
        }, 50);
      },
      closeModal: () => {
        form.resetFields();
        setModalVisible(false);
      },
    }));

    useEffect(() => {
      if (!initialVal) return;

      // Parse existing props into form items
      const nodePropertyList: FormItem[] = handlePropsToFormOption(type, initialVal);
      const displayItems = nodePropertyList.filter((e) => !e.hide);
      setFormItemList(nodePropertyList);
      setFormItems(displayItems);

      // Parse existing auxiliary props
      const originalAuxItems: AuxProp[] = [];
      for (const propsKey in initialVal) {
        const strings = propsKey.split('/');
        const first = strings[0];
        if (strings.length > 0 && first === 'Aux') {
          originalAuxItems.push({
            name: strings.slice(1).join('/'),
            value: initialVal[propsKey] as string,
            id: uniqId(),
          });
        }
      }
      setAuxProps(originalAuxItems);

      form.resetFields();

      setTimeout(() => {
        const formValues: Record<string, unknown> = {};
        displayItems.forEach((item) => {
          if (!item.hide && item.name in initialVal) {
            formValues[item.name] = initialVal[item.name];
          } else if (!item.hide) {
            formValues[item.name] = item.defaultValue;
          }
        });

        form.setFieldsValue(formValues);
      }, 0);

      setDeleteProps([]);
      setDeleteAll(false);
    }, [initialVal, type, form]);

    // Handle showing a previously hidden property
    const handleAddProperty = (propertyName: string) => {
      const property = formItemList.find((e) => e.name === propertyName) || ({} as FormItem);
      const newFormItems = [...formItems, { ...property, hide: false }];
      setFormItems(newFormItems);
      setFormItemList(formItemList.map((e) => (e.name === propertyName ? { ...e, hide: false } : e)));
    };

    // Hide a property (mark it for deletion)
    const handleRemoveProperty = useCallback(
      (propertyName: string) => {
        const newFormItem = formItems.map((e) => (e.name === propertyName ? { ...e, hide: true } : e));
        setFormItems(newFormItem);
        setFormItemList(formItemList.map((e) => (e.name === propertyName ? { ...e, hide: true } : e)));
        setDeleteProps([...deleteProps, propertyName]);
      },
      [formItemList, formItems, deleteProps],
    );

    // Add a new auxiliary property
    const handleAddAuxProp = () => {
      setAuxProps((prev) => [
        ...prev,
        {
          name: '',
          value: '',
          id: uniqId(),
        },
      ]);
    };

    // Delete a specific auxiliary property
    const handleDeleteAuxProp = (id: string) => {
      setAuxProps((prev) => prev.filter((e) => e.id !== id));
      const toRemove = auxProps.find((e) => e.id === id);
      if (toRemove) {
        setDeleteProps((prev) => [...prev, `Aux/${toRemove.name}`]);
      }
    };

    // Update an auxiliary property
    const handleAuxChange = ({ name, value, id }: AuxProp) => {
      setAuxProps((prev) => prev.map((e) => (e.id === id ? { ...e, name, value } : e)));
    };

    // Convert aux props to object with "Aux/" prefix
    const handleAuxVal = (val: AuxProp[]) => {
      const res: { [key: string]: string } = {};
      for (const item of val) {
        if (item.name !== '' && item.value !== '') {
          res[`Aux/${item.name}`] = item.value;
        }
      }
      return res;
    };

    // Delete all properties
    const handleDeleteAllProp = () => {
      setFormItems([]);
      setAuxProps([]);
      setDeleteAll(true);
    };

    // Submit only changed data after validation
    const handleSubmitData = (data: Record<string, unknown>) => {
      const original = currentInitialVal ?? {};
      const changedData: Record<string, unknown> = {};

      // Compare each field in form data with currentInitialVal
      Object.entries(data).forEach(([key, val]) => {
        if (original[key] !== val) {
          changedData[key] = val;
        }
      });

      // Compare aux props
      const newAuxObj = handleAuxVal(auxProps);
      Object.entries(newAuxObj).forEach(([key, val]) => {
        if (original[key] !== val) {
          changedData[key] = val;
        }
      });

      // Delete all overrides everything
      const delete_props = deleteAll ? Object.keys(original) : deleteProps;

      handleSubmit({
        override_props: changedData as Properties,
        delete_props,
      });

      setModalVisible(false);
    };

    // Reset the form when closing the modal
    const handleModalClose = () => {
      form.resetFields();
      setModalVisible(false);

      // Reset all states to initial values
      setDeleteProps([]);
      setDeleteAll(false);

      // Reset form items to original state
      if (initialVal) {
        const nodePropertyList: FormItem[] = handlePropsToFormOption(type, initialVal);
        const displayItems = nodePropertyList.filter((e) => !e.hide);
        setFormItemList(nodePropertyList);
        setFormItems(displayItems);

        // Reset aux props to original state
        const originalAuxItems: AuxProp[] = [];
        for (const propsKey in initialVal) {
          const strings = propsKey.split('/');
          const first = strings[0];
          if (strings.length > 0 && first === 'Aux') {
            originalAuxItems.push({
              name: strings.slice(1).join('/'),
              value: initialVal[propsKey] as string,
              id: uniqId(),
            });
          }
        }
        setAuxProps(originalAuxItems);
      } else {
        // If no initial values, reset to empty state
        setFormItemList([]);
        setFormItems([]);
        setAuxProps([]);
      }
    };

    return (
      <>
        <div
          onClick={() => {
            setModalVisible(true);
          }}
        >
          {children}
        </div>
        <Modal
          key={JSON.stringify(initialVal)}
          title="Property Editor"
          destroyOnClose
          open={modalVisible}
          onCancel={handleModalClose}
          okText="Submit"
          cancelText="Cancel"
          className="property__modal"
          width={800}
          styles={{
            body: { maxHeight: '70vh', overflow: 'auto' },
          }}
          onOk={() => form.submit()}
        >
          <div style={{ minHeight: 400, paddingBottom: '1em' }}>
            <SingleSelectDescription
              options={formItemList
                .filter((e) => e.hide)
                .map((e) => ({
                  value: e.name,
                  label: e.label,
                  isPlaceholder: false,
                  isDisabled: false,
                  description: e.tipLabel,
                }))}
              handleAddProperty={handleAddProperty}
              handleAddAuxProp={handleAddAuxProp}
              handleDeleteAllAuxProp={handleDeleteAllProp}
            />

            {/* Aux props inline */}
            {auxProps.map((prop, index) => (
              <div key={prop.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '12px' }}>
                {index === 0 && (
                  <div style={{ display: 'flex', fontWeight: 'bold', marginBottom: '8px' }}>
                    <div style={{ width: '40%' }}>Name</div>
                    <div style={{ width: '40%' }}>Value</div>
                    <div style={{ width: '20%' }} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '40%' }}>
                    <Input
                      value={prop.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        handleAuxChange({ id: prop.id, name: newName, value: prop.value });
                      }}
                      placeholder="Please input property name"
                      addonBefore="Aux/"
                      style={{ fontWeight: 'normal' }}
                    />
                  </div>
                  <div style={{ width: '40%', marginLeft: '8px' }}>
                    <Input
                      value={prop.value}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        handleAuxChange({ id: prop.id, name: prop.name, value: newValue });
                      }}
                      placeholder="Please input property value"
                      style={{ fontWeight: 'normal' }}
                    />
                  </div>
                  <div style={{ width: '20%', textAlign: 'right' }}>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteAuxProp(prop.id)}
                      shape="circle"
                      onMouseEnter={(e) => {
                        const parent = e.currentTarget.parentElement!.parentElement!;
                        parent.style.fontWeight = 'bold';
                        parent.querySelectorAll('input').forEach((input) => {
                          input.style.fontWeight = 'bold';
                        });
                      }}
                      onMouseLeave={(e) => {
                        const parent = e.currentTarget.parentElement!.parentElement!;
                        parent.style.fontWeight = 'normal';
                        parent.querySelectorAll('input').forEach((input) => {
                          input.style.fontWeight = 'normal';
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Visible form items with required validation */}
            <Form
              key={JSON.stringify(currentInitialVal)}
              form={form}
              onFinish={handleSubmitData}
              onFinishFailed={() =>
                Modal.error({
                  title: 'Validation Error',
                  content: 'Please fill in all required fields.',
                })
              }
              style={{ marginTop: '2em' }}
            >
              {formItems.map((item) => {
                if (item.hide) return null;
                const commonFormProps = {
                  key: item.id,
                  label: item.label,
                  name: item.name,
                  initialValue: item.defaultValue,
                  tooltip: item.tipLabel,
                  style: { marginBottom: 0, flexGrow: 1 },
                  rules: [{ required: true, message: `Please input ${item.label}` }],
                };

                let element: React.ReactNode = null;
                switch (item.type) {
                  case 'text':
                    element = <Input />;
                    break;
                  case 'single_select':
                    element = (
                      <Select>
                        {item.extraInfo?.options?.map((opt) => (
                          <Select.Option key={opt.value} value={opt.value} disabled={opt.isDisabled}>
                            {opt.label}
                          </Select.Option>
                        ))}
                      </Select>
                    );
                    break;
                  case 'multiple_select':
                    element = (
                      <Select mode="multiple">
                        {item.extraInfo?.options?.map((opt) => (
                          <Select.Option key={opt.value} value={opt.value} disabled={opt.isDisabled}>
                            {opt.label}
                          </Select.Option>
                        ))}
                      </Select>
                    );
                    break;
                  case 'integer':
                    element = <InputNumber style={{ width: '100%' }} />;
                    break;
                  case 'text_area':
                    element = <Input.TextArea rows={4} />;
                    break;
                  case 'checkbox':
                    element = <Checkbox />;
                    break;
                  case 'radio':
                    element = (
                      <Radio.Group>
                        {item.extraInfo?.options?.map((opt) => (
                          <Radio key={opt.value} value={opt.value} disabled={opt.isDisabled}>
                            {opt.label}
                          </Radio>
                        ))}
                      </Radio.Group>
                    );
                    break;
                  case 'slider':
                    element = <Slider />;
                    break;
                  default:
                    return null;
                }

                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '1em' }}>
                    <Form.Item {...commonFormProps} valuePropName={item.type === 'checkbox' ? 'checked' : undefined}>
                      {element}
                    </Form.Item>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      shape="circle"
                      style={{ marginLeft: 8 }}
                      onClick={() => handleRemoveProperty(item.name)}
                      onMouseEnter={(e) => (e.currentTarget.parentElement!.style.fontWeight = 'bold')}
                      onMouseLeave={(e) => (e.currentTarget.parentElement!.style.fontWeight = 'normal')}
                    />
                  </div>
                );
              })}
            </Form>
          </div>
        </Modal>
      </>
    );
  },
);

PropertyForm.displayName = 'PropertyForm';

export default PropertyForm;
