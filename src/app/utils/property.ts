// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import camelCase from 'camelcase';

import { properties } from '@app/utils/properties/properties';
import { drbdOptions } from '@app/utils/properties/drbdOptions';
import { propertyConstants } from '@app/utils/properties/propertyConstants';
import { FormItem, TYPE_MAP } from '@app/interfaces/dynamicFormType';
import { uniqId } from './stringUtils';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function handlePropsToFormOption(key: string, prop = {}): FormItem[] {
  if (!key || key === '') {
    return [];
  }
  const propInfo = properties.objects[key];

  let propsArr = [...properties.objects[key]];

  if (drbdOptions.objects[key]) {
    propsArr = [...propsArr, ...drbdOptions.objects[key]];
  }

  const propsArrData = Object.entries({ ...properties.properties, ...drbdOptions.properties }).filter(
    (el) => propsArr.indexOf(el[0]) > -1,
  );

  return propsArrData.map(([key, data]) => {
    let field: string;

    if (Array.isArray(data.key)) {
      field = data.key.map((name) => (propertyConstants.data.find((r) => r.name === name) || {}).value).join('/');
    } else {
      // DRDB Options
      field = data.key;
    }

    const value = prop[field];
    const hide = typeof value === 'undefined'; // if this prop has value then display it as initial value
    const title = field || camelCase(key, { pascalCase: true });

    let formInfo = {
      type: '',
      name: '',
      label: '',
    } as unknown as FormItem;

    switch (data.type) {
      case 'regex':
        formInfo = {
          id: uniqId(),
          type: TYPE_MAP.TEXT,
          label: title,
          name: field,
          defaultValue: value || '',
          tipLabel: data['info'],
          validationInfo: {
            invalidMessage: `Please match the requested format: ${data['value']}`,
            pattern: new RegExp(data['value']),
          },
          hide,
        };
        break;
      case 'string':
        formInfo = {
          id: uniqId(),
          type: TYPE_MAP.TEXT,
          label: title,
          name: field,
          defaultValue: value || '',
          tipLabel: data['info'],
          hide,
        };
        break;
      case 'symbol':
        formInfo = {
          id: uniqId(),
          type: TYPE_MAP.SINGLE_SELECT,
          label: title,
          name: field,
          defaultValue: value || '',
          tipLabel: data['info'],
          extraInfo: {
            options: (data['values'] ?? []).map((el: string) => ({
              value: el,
              label: el,
              isDisabled: false,
            })),
          },
          hide,
        };
        break;
      case 'numeric-or-symbol':
        formInfo = {
          id: uniqId(),
          type: TYPE_MAP.SINGLE_SELECT,
          label: title,
          name: field,
          defaultValue: value || '',
          tipLabel: data['info'],
          extraInfo: {
            options: (data['values'] ?? []).map((el: string) => ({
              value: el,
              label: el,
              isDisabled: false,
            })),
            isCreatable: true,
          },
          hide,
        };
        break;
      case 'range':
        // eslint-disable-next-line no-case-declarations
        const max = data['max'] || 10000;
        // eslint-disable-next-line no-case-declarations
        const min = data['min'] || 0;
        // use number input if range is very large
        if (max - min > 10000) {
          formInfo = {
            id: uniqId(),
            type: TYPE_MAP.INTEGER,
            label: title,
            name: field,
            defaultValue: value || '',
            validationInfo: {
              min,
              max,
            },
            tipLabel: data['info'],
            hide,
          };
        } else {
          formInfo = {
            id: uniqId(),
            type: TYPE_MAP.SLIDER,
            label: title,
            name: field,
            defaultValue: value || data['default'] || data['min'],
            tipLabel: data['info'],
            validationInfo: {
              min: data['min'],
              max: data['max'],
            },
            hide,
          };
        }
        break;
      // TODO：handle value
      case 'boolean_true_false':
        formInfo = {
          id: uniqId(),
          type: TYPE_MAP.CHECKBOX,
          label: title,
          name: field,
          defaultValue: typeof value === 'string' ? (value === 'true' ? true : false) : Boolean(value),
          tipLabel: data['info'],
          hide,
        };
        break;
      // TODO：handle value
      case 'boolean':
        formInfo = {
          id: uniqId(),
          type: TYPE_MAP.CHECKBOX,
          label: title,
          name: field,
          defaultValue: value || '',
          tipLabel: data['info'],
          hide,
        };
        break;
      case 'long':
        formInfo = {
          id: uniqId(),
          type: TYPE_MAP.INTEGER,
          label: title,
          name: field,
          defaultValue: value || '',
          tipLabel: data['info'],
          hide,
        };
        break;
      default:
        console.log('Unknown type', data.type);
    }

    return formInfo;
  });
}
