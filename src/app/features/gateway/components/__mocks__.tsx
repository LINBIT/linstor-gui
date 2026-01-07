// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { ReactElement, forwardRef, isValidElement, cloneElement } from 'react';
import { vi } from 'vitest';

// Mock antd components
// Store for form values during test execution
const formValues = new Map<string, any>();

// Helper to capture form values (exported for tests to use directly)
export const captureValue = (name: string, value: any) => {
  if (name) {
    formValues.set(name, value);
  }
};

// Helper to reset form values
export const resetFormValues = () => formValues.clear();

const FormItem = ({ children, name, onChange: formItemOnChange, ...props }: any) => {
  // Clone children and inject onChange to capture values
  const childArray = Array.isArray(children) ? children : [children];

  const enhanceChild = (child: any, index: number): any => {
    if (!isValidElement(child)) return child;

    // If child has children, recursively enhance them
    if (child.props?.children) {
      const enhancedGrandchildren = Array.isArray(child.props.children)
        ? child.props.children.map((gc: any, i: number) => enhanceChild(gc, i))
        : enhanceChild(child.props.children, 0);

      return cloneElement(child, {
        key: index,
        children: enhancedGrandchildren,
      });
    }

    // Check if this is a native HTML input (has data-testid="input")
    const isNativeInput = child.props?.['data-testid'] === 'input';
    // Check for specific custom components by type name
    const componentTypeName = child.type?.name || child.type?.displayName;
    const isSizeInputComponent = componentTypeName === 'SizeInput';

    // For native inputs, inject onChange to capture values
    if (isNativeInput || child.props?.placeholder !== undefined || child.type === 'input') {
      const originalOnChange = child.props.onChange;

      return cloneElement(child, {
        key: index,
        onChange: (e: any) => {
          let value: any;
          if (typeof e === 'number') {
            value = e;
          } else if (e?.target?.value !== undefined) {
            value = e.target.value;
          } else {
            value = e;
          }
          captureValue(name, value);
          if (originalOnChange) originalOnChange(e);
          if (formItemOnChange) formItemOnChange(value);
        },
      });
    }

    // For custom components like SizeInput, pass onChange as a prop
    if (isSizeInputComponent) {
      const originalOnChange = child.props.onChange;
      return cloneElement(child, {
        key: index,
        onChange: (value: any) => {
          captureValue(name, value);
          if (originalOnChange) originalOnChange(value);
          if (formItemOnChange) formItemOnChange(value);
        },
      });
    }

    return child;
  };

  const enhancedChildren = childArray.map((child: any, index: number) => enhanceChild(child, index));
  return <div data-form-item={name}>{enhancedChildren}</div>;
};
const FormList = ({ children, render }: any) => {
  const fields = []; // Start with empty array, as most lists start empty
  const add = vi.fn();
  const remove = vi.fn();
  const renderFn = render || children;
  return <div data-testid="form-list">{renderFn(fields, { add, remove }, { errors: [] })}</div>;
};

const FormComp = forwardRef<any, any>(({ children, onFinish, onFinishFailed, onSubmit, ...props }, ref) => {
  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
    // For testing purposes, return captured form values
    if (onFinish) {
      // Build values object from the captured form values
      const values: any = {};
      formValues.forEach((value, key) => {
        values[key] = value;
      });
      onFinish(values);
    }
  };

  return (
    <form data-testid="form" ref={ref} onSubmit={handleSubmit}>
      {children}
    </form>
  );
});
FormComp.useForm = () => [
  {
    getFieldValue: vi.fn(() => 1073741824),
    resetFields: vi.fn(),
    setFieldsValue: vi.fn(),
    getFieldsValue: vi.fn(() => ({})),
    setFieldValue: vi.fn(),
    validateFields: vi.fn(() => Promise.resolve({})),
  },
];
FormComp.Item = FormItem;
(FormComp as any).List = FormList;
(FormComp as any).ErrorList = ({ errors }: any) => (
  <div data-testid="form-error-list">{errors?.length > 0 && <span>Errors: {errors.join(', ')}</span>}</div>
);

vi.mock('antd', () => ({
  message: {
    config: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
  Form: FormComp,
  Modal: ({ children, open, onCancel, title }: any) =>
    open ? (
      <div data-testid="modal" data-title={title}>
        {children}
        <button data-testid="modal-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    ) : null,
  Drawer: ({ children, title, open, onClose }: any) =>
    open ? (
      <div data-testid="drawer" data-title={title}>
        <div data-testid="drawer-header">{title}</div>
        <button data-testid="drawer-close" onClick={onClose}>
          Close
        </button>
        <div data-testid="drawer-content">{children}</div>
      </div>
    ) : null,
  List: Object.assign(
    ({ dataSource, renderItem }: any) => (
      <div data-testid="list">
        {dataSource?.map((item: any, index: number) => (
          <div key={index} data-testid={`list-item-${index}`}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    ),
    {
      Item: Object.assign(
        ({ children, onClick, style }: any) => (
          <div data-testid="list-item" onClick={onClick} style={style}>
            {children}
          </div>
        ),
        {
          Meta: ({ title, description }: any) => (
            <div data-testid="list-item-meta">
              <div data-testid="list-item-meta-title">{title}</div>
              <div data-testid="list-item-meta-description">{description}</div>
            </div>
          ),
        },
      ),
    },
  ),
  Popconfirm: ({ children, onConfirm }: any) => (
    <div data-testid="popconfirm">
      {children}
      <button data-testid="popconfirm-ok" onClick={onConfirm}>
        Confirm
      </button>
    </div>
  ),
  Space: Object.assign(({ children }: any) => <div data-testid="space">{children}</div>, {
    Compact: ({ children }: any) => <div data-testid="space-compact">{children}</div>,
  }),
  Layout: Object.assign(
    ({ children, ...props }: any) => (
      <div data-testid="layout" {...props}>
        {children}
      </div>
    ),
    {
      Header: ({ children, ...props }: any) => (
        <header data-testid="layout-header" {...props}>
          {children}
        </header>
      ),
      Content: ({ children, ...props }: any) => (
        <div data-testid="layout-content" {...props}>
          {children}
        </div>
      ),
      Sider: ({ children, ...props }: any) => (
        <aside data-testid="layout-sider" {...props}>
          {children}
        </aside>
      ),
    },
  ),
  Table: ({ columns, dataSource, loading, expandable, rowKey, pagination }: any) => {
    // If pagination is explicitly false, it's a nested inner table
    // The outer table doesn't have a pagination prop at all (undefined)
    const isNestedTable = pagination === false;
    const tableTestId = isNestedTable ? 'nested-table' : 'table';
    const rowTestId = isNestedTable ? 'nested-table-row-' : 'table-row-';
    const expandedTestId = isNestedTable ? 'nested-expanded-row-' : 'expanded-row-';

    return (
      <div data-testid={tableTestId} data-loading={loading} data-rowkey={rowKey} data-is-nested={isNestedTable}>
        {dataSource?.map((item: any, idx: number) => (
          <div key={item[rowKey] || idx} data-testid={`${rowTestId}${idx}`} data-row-key-value={item[rowKey]}>
            {columns?.map((col: any, colIdx: number) => {
              const value = item[col.dataIndex];
              const content = col?.render ? col.render(value, item, idx) : value;
              return <span key={colIdx || col.dataIndex}>{content}</span>;
            })}
          </div>
        ))}
        {expandable &&
          dataSource?.map((item: any, idx: number) => (
            <div key={`expanded-${item[rowKey]}-${idx}`} data-testid={`${expandedTestId}${idx}`}>
              {expandable.expandedRowRender?.(item)}
            </div>
          ))}
      </div>
    );
  },
  Tag: ({ children, color }: any) => (
    <span data-testid="tag" data-color={color}>
      {children}
    </span>
  ),
  Input: Object.assign(
    ({ onChange, placeholder, value, ...props }: any) => (
      <input data-testid="input" placeholder={placeholder} value={value} onChange={onChange} {...props} />
    ),
    {
      Password: ({ onChange, placeholder, value, ...props }: any) => (
        <input
          data-testid="input-password"
          type="password"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          {...props}
        />
      ),
    },
  ),
  Select: ({ options, onChange, value, ...props }: any) => (
    <select data-testid="select" value={value} onChange={(e) => onChange?.(e.target.value)} {...props}>
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
  Checkbox: ({ checked, onChange, children, ...props }: any) => (
    <label>
      <input type="checkbox" checked={checked} onChange={onChange} {...props} />
      {children}
    </label>
  ),
  Switch: ({ checked, onChange, ...props }: any) => (
    <input type="checkbox" checked={checked} onChange={onChange} {...props} />
  ),
  Radio: Object.assign(
    ({ children, ...props }: any) => (
      <label>
        <input type="radio" {...props} />
        {children}
      </label>
    ),
    {
      Group: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
  ),
  ConfigProvider: ({ children }: any) => <>{children}</>,
  Typography: {
    Text: ({ children }: any) => <span>{children}</span>,
    Title: ({ children }: any) => <h1>{children}</h1>,
    Paragraph: ({ children }: any) => <p>{children}</p>,
  },
  Alert: ({ message, type, showIcon }: any) => (
    <div data-testid="alert" data-type={type} data-show-icon={showIcon}>
      {message}
    </div>
  ),
  Button: ({ children, onClick, loading, htmlType, icon, danger, ghost, block, ...props }: any) => (
    <button onClick={onClick} data-loading={loading} type={htmlType} data-icon={!!icon} {...props}>
      {loading && 'Loading...'}
      {children}
    </button>
  ),
  Card: ({ children, title, extra }: any) => (
    <div data-testid="card" data-title={title}>
      {title && <div data-testid="card-title">{title}</div>}
      {extra && <div data-testid="card-extra">{extra}</div>}
      {children}
    </div>
  ),
  Divider: ({ children }: any) => <hr data-testid="divider" />,
  Tooltip: ({ children, title }: any) => (
    <div data-testid="tooltip" data-title={title}>
      {children}
    </div>
  ),
  Collapse: ({ children, accordion }: any) => (
    <div data-testid="collapse" data-accordion={accordion}>
      {children}
    </div>
  ),
  Spin: ({ children, spinning, tip }: any) => (
    <div data-testid="spin" data-spinning={spinning} data-tip={tip}>
      {children}
    </div>
  ),
  Tabs: ({ children, activeKey, onChange }: any) => (
    <div data-testid="tabs" data-active-key={activeKey}>
      {children}
    </div>
  ),
  Steps: ({ children, current }: any) => (
    <div data-testid="steps" data-current={current}>
      {children}
    </div>
  ),
  Descriptions: ({ children, column, bordered }: any) => (
    <div data-testid="descriptions" data-column={column} data-bordered={bordered}>
      {children}
    </div>
  ),
  DatePicker: Object.assign(
    ({ onChange, value, ...props }: any) => (
      <input data-testid="date-picker" value={value} onChange={onChange} {...props} />
    ),
    {
      RangePicker: ({ onChange, value, ...props }: any) => (
        <div data-testid="date-range-picker">
          <input data-testid="date-start" value={value?.[0]} onChange={onChange} />
          <input data-testid="date-end" value={value?.[1]} onChange={onChange} />
        </div>
      ),
    },
  ),
  Breadcrumb: ({ children, ...props }: any) => <div data-testid="breadcrumb">{children}</div>,
  Menu: ({ children, ...props }: any) => <div data-testid="menu">{children}</div>,
  Dropdown: ({ children, overlay }: any) => <div data-testid="dropdown">{children}</div>,
  Avatar: ({ children, src, alt, ...props }: any) => (
    <div data-testid="avatar" data-src={src} data-alt={alt}>
      {children}
    </div>
  ),
  Badge: ({ children, count, ...props }: any) => (
    <div data-testid="badge" data-count={count}>
      {children}
    </div>
  ),
  Progress: ({ percent, ...props }: any) => (
    <div data-testid="progress" data-percent={percent}>
      {percent}%
    </div>
  ),
  Empty: ({ children, description, ...props }: any) => (
    <div data-testid="empty" data-description={description}>
      {description}
    </div>
  ),
  FloatButton: ({ children, ...props }: any) => (
    <button data-testid="float-button" {...props}>
      {children}
    </button>
  ),
}));

// Mock icons
vi.mock('@ant-design/icons', () => ({
  DownOutlined: ({ onClick, style }: any) => (
    <span data-testid="down-icon" onClick={onClick} style={style}>
      ▼
    </span>
  ),
  RightOutlined: ({ onClick, style }: any) => (
    <span data-testid="right-icon" onClick={onClick} style={style}>
      ▶
    </span>
  ),
  MinusCircleOutlined: ({ onClick }: any) => <span data-testid="minus-icon" onClick={onClick} />,
  PlusOutlined: () => <span data-testid="plus-icon">+</span>,
  VerticalAlignTopOutlined: () => <span data-testid="vertical-align-top-icon">↑</span>,
  DeploymentUnitOutlined: () => <span data-testid="deployment-unit-icon" />,
  CloudServerOutlined: () => <span data-testid="cloud-server-icon" />,
  ContainerOutlined: () => <span data-testid="container-icon" />,
  DatabaseOutlined: () => <span data-testid="database-icon" />,
  DesktopOutlined: () => <span data-testid="desktop-icon" />,
  FieldTimeOutlined: () => <span data-testid="field-time-icon" />,
  FileProtectOutlined: () => <span data-testid="file-protect-icon" />,
  InfoCircleOutlined: () => <span data-testid="info-circle-icon" />,
  NodeIndexOutlined: () => <span data-testid="node-index-icon" />,
  PieChartOutlined: () => <span data-testid="pie-chart-icon" />,
  SettingOutlined: () => <span data-testid="setting-icon" />,
  UserOutlined: () => <span data-testid="user-icon" />,
  WarningOutlined: () => <span data-testid="warning-icon" />,
}));

export {};
