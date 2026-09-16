// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Popconfirm } from '..';

// Every call site used to repeat okText="Yes" cancelText="No" as English
// literals, so the confirm buttons were the one part of a Popconfirm that never
// translated. The defaults now come from the catalog; these tests pin that down
// so the literals cannot creep back in.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => `translated:${key}` }),
}));

const open = () => fireEvent.click(screen.getByText('trigger'));

describe('Popconfirm', () => {
  it('labels its buttons from the catalog when the caller passes nothing', () => {
    render(
      <Popconfirm title="Delete this?">
        <span>trigger</span>
      </Popconfirm>,
    );
    open();

    expect(screen.getByText('translated:common:yes')).toBeInTheDocument();
    expect(screen.getByText('translated:common:no')).toBeInTheDocument();
  });

  it('still lets a caller override either label', () => {
    render(
      <Popconfirm title="Delete this?" okText="Evict" cancelText="Keep">
        <span>trigger</span>
      </Popconfirm>,
    );
    open();

    expect(screen.getByText('Evict')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
    expect(screen.queryByText('translated:common:yes')).not.toBeInTheDocument();
  });

  it('runs onConfirm from the default confirm button', async () => {
    const onConfirm = vi.fn();
    render(
      <Popconfirm title="Delete this?" onConfirm={onConfirm}>
        <span>trigger</span>
      </Popconfirm>,
    );
    open();

    fireEvent.click(screen.getByText('translated:common:yes'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
