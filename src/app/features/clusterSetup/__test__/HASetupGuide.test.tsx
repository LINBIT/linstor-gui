// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { HASetupGuide } from '../components/HASetupGuide';

const openGuide = () => {
  fireEvent.click(screen.getByText(/Set up a highly available LINSTOR controller/i));
};

describe('HASetupGuide', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders the collapse label and intro', () => {
    render(<HASetupGuide />);
    expect(screen.getByText(/Further LINSTOR tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/Set up a highly available LINSTOR controller/i)).toBeInTheDocument();
  });

  it('shows the generated script with the wizard parameters', () => {
    render(<HASetupGuide storagePool="ha_sp" nodeNames={['gui01', 'gui02', 'gui03']} />);
    openGuide();
    const script = document.querySelector('pre');
    expect(script?.textContent).toContain('STORAGE_POOL = "ha_sp"');
    expect(script?.textContent).toContain('CLUSTER_NODES = ["gui01","gui02","gui03"]');
  });

  it('copies the script to the clipboard', async () => {
    render(<HASetupGuide storagePool="ha_sp" nodeNames={['a', 'b']} />);
    openGuide();
    fireEvent.click(screen.getByRole('button', { name: /Copy script/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const copied = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(copied).toContain('#!/usr/bin/env python3');
    expect(copied).toContain('STORAGE_POOL = "ha_sp"');
  });

  it('falls back to the placeholder pool without wizard input', () => {
    render(<HASetupGuide />);
    openGuide();
    expect(document.querySelector('pre')?.textContent).toContain('STORAGE_POOL = "my-thin-pool"');
  });
});
