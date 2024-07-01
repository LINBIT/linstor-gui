import { handlePropsToFormOption } from '@app/utils/property';
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core';

import { FormItem } from '@app/interfaces/dynamicFormType';
import { uniqId } from '@app/utils/stringUtils';

import SingleSelectDescription from './PropertySelector';
import DynamicForm from '../DynamicForm';
import AuxiliaryPropInput from './AuxiliaryPropInput';
import { Properties } from '@app/features/property';

interface PropertyFormProps {
  type:
    | 'node'
    | 'controller'
    | 'storagepool-definition'
    | 'storagepool'
    | 'resource-definition'
    | 'resource'
    | 'volume-definition'
    | 'volume';
  initialVal?: Record<string, unknown>;
  handleClose: () => void;
  openStatus: boolean;
  handleSubmit: (data: { override_props?: Properties; delete_props?: Array<string> }) => void;
}

type AuxProp = {
  name: string;
  value: string;
  id: string;
};

const PropertyForm: React.FC<PropertyFormProps> = ({ type, initialVal, handleClose, handleSubmit, openStatus }) => {
  const [formItemList, setFormItemList] = useState<FormItem[]>([]); // All list
  const [formItems, setFormItems] = useState<FormItem[]>([]); // display list
  const [auxProps, setAuxProps] = useState<AuxProp[]>([]);
  const [deleteAll, setDeleteAll] = useState(false);
  const [deleteProps, setDeleteProps] = useState<Array<string>>([]);

  useEffect(() => {
    const nodePropertyList: FormItem[] = handlePropsToFormOption(type, initialVal);
    const displayItems = nodePropertyList.filter((e) => !e.hide);
    setFormItemList(nodePropertyList);
    setFormItems(displayItems);

    /**
     * handle aux props
     */
    const originalAuxItems: AuxProp[] = [];
    for (const propsKey in initialVal) {
      const strings = propsKey.split('/');
      const first = strings[0];
      if (strings.length > 0 && first === 'Aux') {
        originalAuxItems.push({
          // 取除去Aux/的字符串
          name: strings.slice(1).join('/'),
          value: initialVal[propsKey] as string,
          id: uniqId(),
        });
      }
    }
    setAuxProps(originalAuxItems);
  }, [initialVal, setFormItems, type]);

  const handleAddProperty = (propertyName: string) => {
    const property = formItemList.find((e) => e.name === propertyName) || ({} as FormItem);
    const newFormItems = [...formItems, { ...property, hide: false }];
    setFormItems(newFormItems);
    setFormItemList(formItemList.map((e) => (e.name === propertyName ? { ...e, hide: false } : e)));
  };

  const handleRemoveProperty = useCallback(
    (propertyName: string) => {
      const newFormItem = formItems.map((e) => (e.name === propertyName ? { ...e, hide: true } : e));
      setFormItems(newFormItem);
      setFormItemList(formItemList.map((e) => (e.name === propertyName ? { ...e, hide: true } : e)));
      setDeleteProps([...deleteProps, propertyName]);
    },
    [formItemList, formItems, deleteProps],
  );

  const handleAddAuxProp = () => {
    setAuxProps([
      ...auxProps,
      {
        name: '',
        value: '',
        id: uniqId(),
      },
    ]);
  };

  const handleDeleteAuxProp = (id: string) => {
    setAuxProps(auxProps.filter((e) => e.id !== id));

    const deleteAuxProp = auxProps.find((e) => e.id === id);

    if (deleteAuxProp) {
      setDeleteProps([...deleteProps, `Aux/${deleteAuxProp?.name}`]);
    }
  };

  const handleAuxChange = ({ name, value, id }) => {
    setAuxProps(auxProps.map((e) => (e.id === id ? { ...e, name, value } : e)));
  };

  /**
   * handle auxiliary props and pass them to DynamicForm
   * @param val
   * @returns {[x: string]: string}
   */
  const handleAuxVal = (val: AuxProp[]) => {
    const res = {};

    for (const item of val) {
      if (item.name !== '' && item.value !== '') {
        /**
         * Needs a prefix 'Aux/'
         */
        res[`Aux/${item.name}`] = item.value;
      }
    }

    return res;
  };

  /**
   * Delete All props
   */
  const handleDeleteAllProp = () => {
    setFormItems([]);
    setAuxProps([]);
    setDeleteAll(true);
  };

  const handleSubmitData = (data) => {
    const delete_props = deleteAll ? Object.keys(initialVal ?? []) : deleteProps ?? [];
    const override_props = data ?? {};

    handleSubmit({
      override_props,
      delete_props,
    });
  };

  return openStatus ? (
    <Modal
      variant={ModalVariant.medium}
      title="Property Editor"
      isOpen={openStatus}
      onClose={() => {
        handleClose();
        setFormItems([]);
      }}
      className="property__modal"
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
        {auxProps.map((e) => (
          <AuxiliaryPropInput
            key={e.id}
            initialVal={e}
            handleDeleteAuxProp={handleDeleteAuxProp}
            onChange={handleAuxChange}
          />
        ))}
        <DynamicForm
          formItems={formItems}
          handleSubmitData={handleSubmitData}
          handleRemoveItem={handleRemoveProperty}
          removable
          handleCancelClick={handleClose}
          extra={handleAuxVal(auxProps)}
          propertyForm={true}
        />
      </div>
    </Modal>
  ) : null;
};

export default PropertyForm;
