// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Form,
  FormGroup,
  TextInput,
  TextArea,
  ActionGroup,
  Button,
  FormSelect,
  FormSelectOption,
  Checkbox,
  Radio,
  ExpandableSection,
  Popover,
  Slider,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import MultiSelect from '@app/components/DynamicForm/MultiSelect';
import SizeInput from '@app/components/DynamicForm/SizeInput';
import { TYPE_MAP, FormItem } from '@app/interfaces/dynamicFormType';
import './index.css';
import { SwitchInput } from './SwitchInput';

interface Props {
  formItems: Array<FormItem>;
  handleSubmitData: (data: { [key: string]: string | number | boolean | Array<string> }) => void;
  handleCancelClick?: () => void;
  submitting?: boolean;
  editing?: boolean;
  initialVal?: { [key: string]: any };
  isHorizontal?: boolean;
  isWidthLimited?: boolean;
  hasAdvancedItems?: boolean;
  advanceFormItems?: Array<FormItem>;
  handleRemoveItem?: (name: string) => void;
  /** true for PropertyEditor */
  removable?: boolean;
  /** extra data for PropertyEditor, mostly for aux props */
  extra?: { [key: string]: string };
  className?: string;
  propertyForm?: boolean;
}

const DynamicForm: React.FunctionComponent<Props> = ({
  handleSubmitData,
  formItems,
  isHorizontal,
  handleCancelClick,
  submitting,
  isWidthLimited,
  hasAdvancedItems,
  advanceFormItems,
  handleRemoveItem,
  removable,
  extra,
  className,
  propertyForm = false,
}) => {
  const {
    watch,
    control,
    handleSubmit,
    formState: { errors },
    unregister,
  } = useForm();

  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation('common');

  // Handle watch value
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const item = formItems.find((e) => e.name === name);
      if (item?.needWatch && value) {
        item.watchCallback && item.watchCallback(value[name as string]);
      }
    });
    return () => subscription.unsubscribe();
  }, [formItems, watch]);

  // Submit form data
  const onSubmit = (data) => {
    // prevent sending request when double click
    if (submitting) {
      return;
    }

    if (extra && Object.keys(extra as any).length > 0) {
      handleSubmitData({ ...data, ...extra });
    } else {
      handleSubmitData(data);
    }
  };

  const colOfPropertyItem = propertyForm
    ? {
        lg: 12,
      }
    : {};

  // render single item
  const renderFormItem = useCallback(
    (item: FormItem) => {
      const extraProps = item?.tipLabel
        ? {
            labelIcon: (
              <Popover
                headerContent={<div>{item?.tipLabel}</div>}
                bodyContent={item?.validationInfo?.pattern ? <div>{String(item?.validationInfo?.pattern)}</div> : ''}
              >
                <button
                  type="button"
                  aria-label="More info for name field"
                  onClick={(e) => e.preventDefault()}
                  aria-describedby="simple-form-name-01"
                  className="pf-c-form__group-label-help"
                >
                  <HelpIcon noVerticalAlign />
                </button>
              </Popover>
            ),
          }
        : {};

      const removableEle = removable ? (
        <Button
          variant="danger"
          style={{ width: '10%', float: 'right' }}
          onClick={() => {
            if (handleRemoveItem) {
              handleRemoveItem(item.name);
              unregister(item.name);
            }
          }}
        >
          Delete
        </Button>
      ) : null;

      const removableStyle = removable
        ? {
            width: '85%',
          }
        : {};

      const hasPattern = item?.validationInfo?.pattern;
      const rules = hasPattern
        ? {
            required: item?.validationInfo?.isRequired,
            pattern: {
              value: item?.validationInfo?.pattern,
              message: item?.validationInfo?.invalidMessage,
              minLength: item?.validationInfo?.minLength,
            },
          }
        : { required: item?.validationInfo?.isRequired, minLength: item?.validationInfo?.minLength };

      switch (item.type) {
        case TYPE_MAP.TEXT:
          return (
            <Controller
              key={item.name}
              name={item.name}
              control={control}
              rules={rules}
              defaultValue={item.defaultValue}
              render={({ field }) => (
                <FormGroup
                  label={item.label}
                  isRequired={item?.validationInfo?.isRequired}
                  fieldId={item.name}
                  validated={errors[item.name] ? 'error' : 'success'}
                  helperTextInvalid={item?.validationInfo?.invalidMessage}
                  {...extraProps}
                >
                  <TextInput id={item.name} isDisabled={item.isDisabled} {...field} style={removableStyle} />
                  {removableEle}
                </FormGroup>
              )}
            />
          );
        case TYPE_MAP.SINGLE_SELECT:
          return (
            <Controller
              key={item.name}
              name={item.name}
              control={control}
              rules={{ required: item?.validationInfo?.isRequired }}
              defaultValue={item.defaultValue}
              render={({ field }) => (
                <FormGroup
                  label={item.label}
                  isRequired={item?.validationInfo?.isRequired}
                  fieldId={item.name}
                  validated={errors[item.name] ? 'error' : 'success'}
                  helperTextInvalid={item?.validationInfo?.invalidMessage}
                  {...extraProps}
                >
                  <FormSelect
                    id={item.name}
                    aria-label="Dropdown Select"
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    isDisabled={item.isDisabled}
                    style={removableStyle}
                  >
                    {(item.extraInfo ?? { options: [] }).options.map(
                      (option: { label: string; value: string; isDisabled: boolean; isPlaceholder?: boolean }) => (
                        <FormSelectOption
                          key={option.value}
                          value={option.value}
                          label={option.label}
                          isDisabled={option?.isDisabled}
                          isPlaceholder={option?.isPlaceholder}
                        />
                      )
                    )}
                  </FormSelect>
                  {removableEle}
                </FormGroup>
              )}
            />
          );
        case TYPE_MAP.MULTIPLE_SELECT:
          return (
            <Controller
              key={item.name}
              name={item.name}
              control={control}
              rules={{ required: item?.validationInfo?.isRequired }}
              defaultValue={item.defaultValue}
              render={({ field: { name, onChange, value } }) => (
                <FormGroup
                  label={item.label}
                  isRequired={item?.validationInfo?.isRequired}
                  fieldId={item.name}
                  validated={errors[item.name] ? 'error' : 'success'}
                  helperTextInvalid={item?.validationInfo?.invalidMessage}
                >
                  <MultiSelect
                    id={item.name}
                    options={item?.extraInfo?.options || []}
                    name={name}
                    onChange={onChange}
                    value={value || item.defaultValue}
                    isCreatable={item?.extraInfo?.isCreatable}
                    style={removableStyle}
                  />
                  {removableEle}
                </FormGroup>
              )}
            />
          );
        case TYPE_MAP.SIZE:
          return (
            <Controller
              key={item.name}
              name={item.name}
              control={control}
              rules={{ required: item?.validationInfo?.isRequired }}
              defaultValue={item.defaultValue}
              render={({ field: { name, onChange, value } }) => (
                <FormGroup
                  label={item.label}
                  isRequired={item?.validationInfo?.isRequired}
                  fieldId={item.name}
                  validated={errors[item.name] ? 'error' : 'success'}
                  helperTextInvalid={item?.validationInfo?.invalidMessage}
                >
                  <SizeInput
                    id={item.name}
                    options={item?.extraInfo?.options || []}
                    name={name}
                    onChange={onChange}
                    value={value || item.defaultValue}
                    isCreatable={item?.extraInfo?.isCreatable}
                    style={removableStyle}
                  />
                  {removableEle}
                </FormGroup>
              )}
            />
          );
        case TYPE_MAP.INTEGER:
          return (
            <Controller
              key={item.name}
              name={item.name}
              control={control}
              rules={{ required: item?.validationInfo?.isRequired, min: item?.validationInfo?.min || 1 }}
              defaultValue={item.defaultValue}
              render={({ field }) => (
                <FormGroup
                  type="number"
                  label={item.label}
                  isRequired={item?.validationInfo?.isRequired}
                  helperTextInvalid={item?.validationInfo?.invalidMessage}
                  fieldId={item.name}
                  validated={errors[item.name] ? 'error' : 'success'}
                  {...extraProps}
                >
                  <TextInput
                    type="number"
                    id={item.name}
                    name={field.name}
                    onChange={field.onChange}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    style={removableStyle}
                  />
                  {removableEle}
                </FormGroup>
              )}
            />
          );
        case TYPE_MAP.TEXTAREA:
          return (
            <Controller
              key={item.name}
              name={item.name}
              control={control}
              rules={{ required: item?.validationInfo?.isRequired, min: item?.validationInfo?.min || 1 }}
              defaultValue={item.defaultValue}
              render={({ field }) => (
                <FormGroup
                  label={item.label}
                  isRequired={item?.validationInfo?.isRequired}
                  helperTextInvalid={item?.validationInfo?.invalidMessage}
                  fieldId={item.name}
                  validated={errors[item.name] ? 'error' : 'success'}
                >
                  <TextArea id={item.name} {...field} style={removableStyle} />
                  {removableEle}
                </FormGroup>
              )}
            />
          );
        case TYPE_MAP.CHECKBOX:
          return (
            <Controller
              key={item.name}
              name={item.name}
              control={control}
              defaultValue={item?.defaultValue}
              render={({ field }) => (
                <FormGroup fieldId={item.name}>
                  <Checkbox
                    label={
                      <div>
                        {item.label}
                        {extraProps.labelIcon}
                      </div>
                    }
                    isChecked={field.value || item?.defaultValue}
                    id={item.name}
                    onChange={field.onChange}
                    aria-label={item.label}
                  />
                  {removableEle}
                </FormGroup>
              )}
            />
          );
        case TYPE_MAP.RADIO:
          return (
            <Controller
              key={item.name}
              name={item.name}
              control={control}
              rules={{ required: item?.validationInfo?.isRequired }}
              defaultValue={item.defaultValue}
              render={({ field }) => (
                <FormGroup
                  label={item.label}
                  fieldId={item.name}
                  isRequired={item?.validationInfo?.isRequired}
                  helperTextInvalid={item?.validationInfo?.invalidMessage}
                >
                  {item.extraInfo?.options.map((e, index) => {
                    return (
                      <Radio
                        key={index}
                        isChecked={field.value === e.value}
                        name={field.name}
                        onChange={() => {
                          field.onChange(e.value);
                        }}
                        label={e.label}
                        id={e.label}
                        value={e.value}
                      />
                    );
                  })}
                </FormGroup>
              )}
            />
          );
        case TYPE_MAP.SLIDER:
          return (
            <Controller
              key={item.name}
              name={item.name}
              control={control}
              defaultValue={item.defaultValue}
              render={({ field }) => (
                <FormGroup
                  label={item.label}
                  isRequired={item?.validationInfo?.isRequired}
                  fieldId={item.name}
                  validated={errors[item.name] ? 'error' : 'success'}
                  helperTextInvalid={item?.validationInfo?.invalidMessage}
                  {...extraProps}
                >
                  <div style={removableStyle}>
                    <Slider
                      min={item.validationInfo?.min || 0}
                      max={item.validationInfo?.max || 100}
                      value={field.value}
                      onChange={(value, inputValue) => {
                        if (inputValue) {
                          // TODO: check input value
                          field.onChange(inputValue);
                        } else {
                          field.onChange(value);
                        }
                      }}
                      isInputVisible
                      inputValue={field.value}
                      showBoundaries={false}
                    />
                  </div>
                  {removableEle}
                </FormGroup>
              )}
            />
          );
        case TYPE_MAP.SWITCH_INPUT:
          return <SwitchInput name={''} label={''} id={''} control={control} />;
        default:
          return null;
      }
    },
    [control, errors, handleRemoveItem, removable, unregister]
  );

  // handle blank from
  const isBlankForm = useMemo(() => {
    return Array.isArray(formItems) && formItems.length === 0;
  }, [formItems]);

  return (
    <Form
      onSubmit={handleSubmit(onSubmit)}
      isHorizontal={isHorizontal}
      isWidthLimited={isWidthLimited}
      className={className}
    >
      <Grid hasGutter>
        {!isBlankForm &&
          formItems
            .filter((e) => !e.hide) // Filter all hidden items
            .map((item) => (
              <GridItem key={item.id} lg={4} md={12} {...(colOfPropertyItem as any)}>
                {renderFormItem(item)}
              </GridItem>
            ))}
      </Grid>

      {hasAdvancedItems && (
        <ExpandableSection
          toggleText={isExpanded ? 'Hide advanced settings' : 'Show advanced settings'}
          onToggle={(val) => {
            setIsExpanded(val);
            if (!val) {
              unregister(advanceFormItems?.map((e) => e.name));
            }
          }}
          isExpanded={isExpanded}
        />
      )}

      {isExpanded && (
        <Grid hasGutter>
          {advanceFormItems?.map((item) => (
            <GridItem key={item.id} lg={4} md={12} {...(colOfPropertyItem as any)}>
              {renderFormItem(item)}
            </GridItem>
          ))}
        </Grid>
      )}

      {(!isBlankForm || removable) && ( // removable means isPropertyEditor
        <ActionGroup>
          <Button variant="primary" type="submit" isLoading={submitting}>
            {t('submit')}
          </Button>
          <Button variant="link" onClick={handleCancelClick}>
            {t('cancel')}
          </Button>
        </ActionGroup>
      )}
    </Form>
  );
};

export default DynamicForm;
