// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Empty, theme } from 'antd';

/**
 * A plain list of rows with a title, a description and actions on the right:
 * what antd's List (deprecated in antd 6) was used for here. Its successor,
 * Listy, is a bare virtual list without this row layout.
 */
type ItemListProps<T> = {
  items?: T[];
  rowKey?: (item: T, index: number) => React.Key;
  renderItem: (item: T, index: number) => React.ReactNode;
};

const ItemList = <T,>({ items = [], rowKey, renderItem }: ItemListProps<T>) =>
  items.length ? (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {items.map((item, index) => (
        <React.Fragment key={rowKey ? rowKey(item, index) : index}>{renderItem(item, index)}</React.Fragment>
      ))}
    </ul>
  ) : (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
  );

type ItemProps = {
  actions?: React.ReactNode[];
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  children?: React.ReactNode;
};

const Item = ({ actions, className, style, onClick, children }: ItemProps) => {
  const { token } = theme.useToken();
  return (
    <li
      className={className}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: token.marginLG,
        padding: `${token.paddingSM}px 0`,
        borderBlockEnd: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
        ...style,
      }}
    >
      {children}
      {actions?.length ? (
        <ul
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: token.marginXS,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            flex: 'none',
          }}
        >
          {actions.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
};

type MetaProps = {
  avatar?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

const Meta = ({ avatar, title, description }: MetaProps) => {
  const { token } = theme.useToken();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: token.margin, flex: 1, minWidth: 0 }}>
      {avatar}
      <div style={{ minWidth: 0 }}>
        {title ? <div style={{ color: token.colorText, marginBottom: token.marginXXS }}>{title}</div> : null}
        {description ? <div style={{ color: token.colorTextDescription }}>{description}</div> : null}
      </div>
    </div>
  );
};

ItemList.Item = Item;
ItemList.Meta = Meta;

export { ItemList };
export default ItemList;
