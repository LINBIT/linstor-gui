// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Input as AntInput, InputProps as AntInputProps, InputRef } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import type { SearchProps } from 'antd/es/input/Search';
import type { PasswordProps } from 'antd/es/input/Password';
import styled from '@emotion/styled';

const BRAND = '#ffcc9c';
const FOCUS_SHADOW = '0 0 0 2px rgba(255, 204, 156, 0.2)';

/**
 * Shared brand focus/hover styling. Covers both the plain `.ant-input`
 * element and the `.ant-input-affix-wrapper` used by Password/Search so that
 * the brand color (#FFCC9C) replaces Ant Design's default blue focus ring.
 */
const brandInputCss = `
  &:hover,
  &.ant-input:hover,
  &.ant-input-affix-wrapper:hover,
  &.ant-input-number:hover {
    border-color: ${BRAND} !important;
  }

  &:focus,
  &.ant-input:focus,
  &.ant-input-focused,
  &.ant-input-affix-wrapper:focus,
  &.ant-input-affix-wrapper-focused {
    border-color: ${BRAND} !important;
    box-shadow: ${FOCUS_SHADOW} !important;
  }

  /* keep the inner <input> of affix wrappers from drawing its own ring */
  .ant-input:focus,
  .ant-input-focused {
    box-shadow: none !important;
  }
`;

const StyledInput = styled(AntInput)`
  ${brandInputCss}
`;

const StyledTextArea = styled(AntInput.TextArea)`
  ${brandInputCss}
`;

const StyledPassword = styled(AntInput.Password)`
  ${brandInputCss}
`;

const StyledSearch = styled(AntInput.Search)`
  ${brandInputCss}
`;

export type InputProps = AntInputProps;

/**
 * Custom Input component.
 * Drop-in replacement for antd's Input with the brand color scheme (#FFCC9C)
 * applied to hover/focus states. Exposes the same sub-components
 * (TextArea, Password, Search, Group) and forwards refs for Form usage.
 */
type InputComponent = React.ForwardRefExoticComponent<InputProps & React.RefAttributes<InputRef>> & {
  TextArea: React.ForwardRefExoticComponent<TextAreaProps & React.RefAttributes<unknown>>;
  Password: React.ForwardRefExoticComponent<PasswordProps & React.RefAttributes<InputRef>>;
  Search: React.ForwardRefExoticComponent<SearchProps & React.RefAttributes<InputRef>>;
  Group: typeof AntInput.Group;
};

const Input = StyledInput as unknown as InputComponent;
Input.TextArea = StyledTextArea as InputComponent['TextArea'];
Input.Password = StyledPassword as InputComponent['Password'];
Input.Search = StyledSearch as InputComponent['Search'];
Input.Group = AntInput.Group;

export { Input };
export default Input;
