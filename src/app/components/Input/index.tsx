// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Input as AntInput, InputProps as AntInputProps, InputRef, Space } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import type { SearchProps } from 'antd/es/input/Search';
import type { PasswordProps } from 'antd/es/input/Password';
import styled from '@emotion/styled';
import { tokens } from '@app/const/color';

const BRAND = tokens.color.brand.primary;
const FOCUS_SHADOW = `0 0 0 2px ${tokens.focusRing}`;

/**
 * Shared brand focus/hover styling. Covers both the plain `.ant-input`
 * element and the `.ant-input-affix-wrapper` used by Password/Search so that
 * the brand color (brand primary) replaces Ant Design's default blue focus ring.
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
  &.ant-input-affix-wrapper:focus,
  &.ant-input-affix-wrapper-focused {
    border-color: ${BRAND} !important;
    box-shadow: ${FOCUS_SHADOW} !important;
  }

  /* keep the inner <input> of affix wrappers from drawing its own ring */
  .ant-input:focus {
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
 * Drop-in replacement for antd's Input with the brand color scheme (brand primary)
 * applied to hover/focus states. Exposes the same sub-components
 * (TextArea, Password, Search, Group) and forwards refs for Form usage.
 */
type InputComponent = React.ForwardRefExoticComponent<InputProps & React.RefAttributes<InputRef>> & {
  TextArea: React.ForwardRefExoticComponent<TextAreaProps & React.RefAttributes<unknown>>;
  Password: React.ForwardRefExoticComponent<PasswordProps & React.RefAttributes<InputRef>>;
  Search: React.ForwardRefExoticComponent<SearchProps & React.RefAttributes<InputRef>>;
  Group: typeof AntInput.Group;
};

/**
 * antd 5 deprecates Input's addonBefore/addonAfter (removed in 6) in favour of
 * Space.Compact with Space.Addon. Callers keep the props; the input is laid
 * out the new way. Form.Item still binds value/onChange/id to the <input>, and
 * style/className go to the wrapper as they did with antd's addon group.
 */
// Like the old addon: the text stays on one line (a path prefix must not wrap).
const ADDON_STYLE: React.CSSProperties = { whiteSpace: 'nowrap' };

const InputWithAddons = React.forwardRef<InputRef, InputProps>(
  ({ addonBefore, addonAfter, style, className, ...props }, ref) => {
    if (!addonBefore && !addonAfter) {
      return <StyledInput ref={ref} style={style} className={className} {...props} />;
    }
    return (
      <Space.Compact block style={style} className={className}>
        {addonBefore && <Space.Addon style={ADDON_STYLE}>{addonBefore}</Space.Addon>}
        <StyledInput ref={ref} {...props} />
        {addonAfter && <Space.Addon style={ADDON_STYLE}>{addonAfter}</Space.Addon>}
      </Space.Compact>
    );
  },
);
InputWithAddons.displayName = 'Input';

const Input = InputWithAddons as unknown as InputComponent;
Input.TextArea = StyledTextArea as unknown as InputComponent['TextArea'];
Input.Password = StyledPassword as unknown as InputComponent['Password'];
Input.Search = StyledSearch as unknown as InputComponent['Search'];
Input.Group = AntInput.Group;

export { Input };
export default Input;
