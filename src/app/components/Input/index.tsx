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
export type InputProps = AntInputProps;

/**
 * antd's Input under the project name; the brand hover/focus border and focus
 * ring come from the Input tokens in the antd theme. Exposes the same
 * sub-components (TextArea, Password, Search, Group) and forwards refs for
 * Form usage.
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
      return <AntInput ref={ref} style={style} className={className} {...props} />;
    }
    return (
      <Space.Compact block style={style} className={className}>
        {addonBefore && <Space.Addon style={ADDON_STYLE}>{addonBefore}</Space.Addon>}
        <AntInput ref={ref} {...props} />
        {addonAfter && <Space.Addon style={ADDON_STYLE}>{addonAfter}</Space.Addon>}
      </Space.Compact>
    );
  },
);
InputWithAddons.displayName = 'Input';

const Input = InputWithAddons as unknown as InputComponent;
Input.TextArea = AntInput.TextArea as unknown as InputComponent['TextArea'];
Input.Password = AntInput.Password as unknown as InputComponent['Password'];
Input.Search = AntInput.Search as unknown as InputComponent['Search'];
Input.Group = AntInput.Group;

export { Input };
export default Input;
