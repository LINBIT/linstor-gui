// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AgentPreview } from '../AgentPreview';
import { TomlPreview } from '../TomlPreview';
import type { OcfAgentWithMetadata } from '../types';

const ocf = (original: string, params: { key: string; value: string }[]): OcfAgentWithMetadata => ({
  position: { section: 'resources', array_index: null, key: 'start', index: 0 },
  item: {
    original,
    is_ocf: true,
    ocf_agent: { original, provider: 'heartbeat', agent_type: 'IPaddr2', instance_name: 'vip', params },
  },
  metadata: null,
  instanceId: 0,
});

const unit = (original: string): OcfAgentWithMetadata => ({
  position: { section: 'resources', array_index: null, key: 'start', index: 1 },
  item: { original, is_ocf: false, ocf_agent: null },
  metadata: null,
  instanceId: 1,
});

const preview = () => document.querySelector('.ocf-preview-code') as HTMLElement;

describe('AgentPreview', () => {
  it('renders the start array with quoting for values that need it', () => {
    render(
      <AgentPreview
        parsedAgents={[
          ocf('ocf:heartbeat:IPaddr2 vip', [
            { key: 'ip', value: '10.0.0.5' },
            { key: 'note', value: 'has space' },
            { key: 'list', value: 'a,b' },
            { key: 'empty', value: '' },
          ]),
          unit('mysql.service'),
        ]}
        loading={false}
      />,
    );

    expect(screen.getByText('Live Preview (TOML)')).toBeInTheDocument();
    expect(preview().textContent).toBe(
      [
        'start = [',
        `    "ocf:heartbeat:IPaddr2 vip ip=10.0.0.5 note='has space' list='a,b' empty=''",`,
        '    "mysql.service"',
        '  ]',
      ].join('\n'),
    );
    // The surface token switches with data-theme, so the preview follows dark mode.
    expect(preview()).toHaveClass('bg-(--bg-surface)');
  });

  it('renders an empty array and the loading state', () => {
    const { container } = render(<AgentPreview parsedAgents={[]} loading />);

    expect(preview().textContent).toBe('start = [\n\n  ]');
    expect(container.querySelector('.ant-spin-spinning')).not.toBeNull();
  });
});

describe('TomlPreview', () => {
  it('shows the content under the default title', () => {
    render(<TomlPreview content={'runner = "systemd"'} />);

    expect(screen.getByText('Live Preview (TOML)')).toBeInTheDocument();
    expect(preview().textContent).toBe('runner = "systemd"');
    expect(preview()).toHaveClass('bg-(--bg-surface)');
    expect(document.querySelector('.ant-spin-spinning')).toBeNull();
  });

  it('accepts a custom title and the loading state', () => {
    render(<TomlPreview content="x = 1" title="Metadata" loading />);

    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(document.querySelector('.ant-spin-spinning')).not.toBeNull();
  });
});
