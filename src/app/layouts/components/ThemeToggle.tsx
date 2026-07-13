// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import styled from '@emotion/styled';
import { IoSunnyOutline, IoMoonOutline } from 'react-icons/io5';

import { ThemeMode } from '@app/const/themeTokens';
import { useThemeMode } from '@app/hooks';

/**
 * Light/Dark mode segmented toggle (handoff §3, Figma component set 1158:1398).
 *
 * Track: 31px high, 4px radius, 1px border/default, bg/toggle/track fill,
 * 4px gap, two equal-width segments filling the container. Selected segment
 * gets a bg/page pill with border/default; the unselected side brightens to
 * text/primary on hover. Clicking flips `data-theme` and persists the choice.
 */

const Track = styled.div`
  display: flex;
  width: 100%;
  height: 31px;
  gap: 4px;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  background: var(--bg-toggle-track);
`;

const Segment = styled('button', { shouldForwardProp: (prop) => prop !== 'selected' })<{ selected: boolean }>`
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
  cursor: ${({ selected }) => (selected ? 'default' : 'pointer')};
  transition:
    color 150ms ease,
    background 150ms ease;
  background: ${({ selected }) => (selected ? 'var(--bg-page)' : 'transparent')};
  border: ${({ selected }) => (selected ? '1px solid var(--border-default)' : '1px solid transparent')};
  color: ${({ selected }) => (selected ? 'var(--text-nav)' : 'var(--text-muted)')};

  &:hover {
    color: ${({ selected }) => (selected ? 'var(--text-nav)' : 'var(--text-primary)')};
  }

  &:focus-visible {
    outline: 2px solid var(--brand-accent);
    outline-offset: 1px;
  }
`;

/** Collapsed-sidebar fallback: a single icon button that flips the theme. */
const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 31px;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  background: var(--bg-toggle-track);
  color: var(--text-nav);
  cursor: pointer;
  transition: color 150ms ease;

  &:hover {
    color: var(--text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--brand-accent);
    outline-offset: 1px;
  }
`;

interface ThemeToggleProps {
  /** Sidebar is collapsed to icons-only — render a single toggle button. */
  collapsed?: boolean;
}

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

const ThemeToggle: React.FC<ThemeToggleProps> = ({ collapsed }) => {
  const { mode, setMode } = useThemeMode();

  const select = (next: ThemeMode) => {
    setMode(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      select('light');
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      select('dark');
    }
  };

  if (collapsed) {
    const next = mode === 'light' ? 'dark' : 'light';
    return (
      <IconButton
        type="button"
        aria-label={`Switch to ${next} theme`}
        title={`Switch to ${next} theme`}
        onClick={() => select(next)}
      >
        {mode === 'light' ? <IoSunnyOutline size={18} /> : <IoMoonOutline size={14} />}
      </IconButton>
    );
  }

  return (
    <Track role="radiogroup" aria-label="Color theme" onKeyDown={handleKeyDown}>
      {OPTIONS.map(({ mode: value, label }) => (
        <Segment
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          tabIndex={mode === value ? 0 : -1}
          selected={mode === value}
          onClick={() => select(value)}
        >
          {value === 'light' ? <IoSunnyOutline size={18} /> : <IoMoonOutline size={14} />}
          {label}
        </Segment>
      ))}
    </Track>
  );
};

export default ThemeToggle;
