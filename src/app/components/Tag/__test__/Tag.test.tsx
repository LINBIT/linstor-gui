// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tooltip } from 'antd';

import { cssVar } from '@app/const/themeTokens';
import { Tag, type TagTone } from '../index';

const tagOf = (text: string) => screen.getByText(text).closest('.ant-tag') as HTMLElement;

describe('Tag', () => {
  it('is a neutral chip by default', () => {
    render(<Tag>label</Tag>);
    const tag = tagOf('label');
    expect(tag).toHaveAttribute('data-tone', 'neutral');
    expect(tag).toHaveClass('ant-tag-filled');
    expect(tag.style.background).toBe(cssVar('bg/surface'));
    expect(tag.style.color).toBe(cssVar('text/primary'));
    expect(tag.style.borderColor).toBe(cssVar('border/default'));
  });

  // Each tone pins its chip and label tokens, which follow light and dark mode.
  it.each([
    ['highlight', 'brand/muted', 'text/on-brand'],
    ['brand', 'bg/chip/brand', 'text/primary'],
    ['info', 'bg/chip/info', 'text/chip/info'],
    ['success', 'bg/chip/success', 'text/chip/success'],
    ['warning', 'bg/chip/warning', 'text/chip/warning'],
    ['danger', 'bg/chip/danger', 'text/chip/danger'],
  ] as const)('a %s tag takes %s with %s', (tone, bg, text) => {
    render(<Tag tone={tone as TagTone}>label</Tag>);
    const tag = tagOf('label');
    expect(tag).toHaveAttribute('data-tone', tone);
    expect(tag.style.background).toBe(cssVar(bg));
    expect(tag.style.color).toBe(cssVar(text));
    expect(tag.style.borderColor).toBe('transparent');
  });

  it("merges the caller's style and passes antd's props through", () => {
    render(
      <Tag tone="success" className="m-0" style={{ marginBottom: 4 }} icon={<span data-testid="icon" />}>
        label
      </Tag>,
    );
    const tag = tagOf('label');
    expect(tag).toHaveClass('m-0');
    expect(tag.style.marginBottom).toBe('4px');
    expect(tag.style.background).toBe(cssVar('bg/chip/success'));
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('forwards its ref, so it can be a Tooltip child', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(
      <Tooltip title="tip">
        <Tag ref={ref}>label</Tag>
      </Tooltip>,
    );
    expect(ref.current).toBe(tagOf('label'));
  });
});
