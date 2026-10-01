// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
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

/** Collapsed-sidebar fallback: a single icon button that flips the theme. */
interface ThemeToggleProps {
  /** Sidebar is collapsed to icons-only — render a single toggle button. */
  collapsed?: boolean;
}

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--brand-accent)';

const TRACK = 'flex h-[31px] w-full gap-1 rounded border border-(--border-default) bg-(--bg-toggle-track)';

const SEGMENT = `flex min-w-0 flex-[1_1_0] items-center justify-center gap-2 rounded border px-2 py-1.5 text-base leading-none font-medium transition-[color,background] duration-150 ease-[ease] ${FOCUS}`;

const SEGMENT_SELECTED = 'cursor-default border-(--border-default) bg-(--bg-page) text-(--text-nav)';

const SEGMENT_IDLE = 'cursor-pointer border-transparent bg-transparent text-(--text-muted) hover:text-(--text-primary)';

const ICON_BUTTON = `flex h-[31px] w-full cursor-pointer items-center justify-center rounded border border-(--border-default) bg-(--bg-toggle-track) text-(--text-nav) transition-[color] duration-150 ease-[ease] hover:text-(--text-primary) ${FOCUS}`;

const ThemeToggle: React.FC<ThemeToggleProps> = ({ collapsed }) => {
  const { t } = useTranslation();
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
      <button
        className={ICON_BUTTON}
        type="button"
        aria-label={`Switch to ${next} theme`}
        title={`Switch to ${next} theme`}
        onClick={() => select(next)}
      >
        {mode === 'light' ? <IoSunnyOutline size={18} /> : <IoMoonOutline size={14} />}
      </button>
    );
  }

  return (
    <div className={TRACK} role="radiogroup" aria-label={t('common:color_theme')} onKeyDown={handleKeyDown}>
      {OPTIONS.map(({ mode: value, label }) => (
        <button
          key={value}
          className={`${SEGMENT} ${mode === value ? SEGMENT_SELECTED : SEGMENT_IDLE}`}
          type="button"
          role="radio"
          aria-checked={mode === value}
          tabIndex={mode === value ? 0 : -1}
          onClick={() => select(value)}
        >
          {value === 'light' ? <IoSunnyOutline size={18} /> : <IoMoonOutline size={14} />}
          {label}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
