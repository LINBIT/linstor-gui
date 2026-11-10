// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import ConfigEditor from '../ConfigEditor';

const hoisted = vi.hoisted(() => ({
  ha: { data: undefined as unknown, isPending: true },
  file: { data: undefined as unknown, isLoading: true },
  creating: false,
}));

vi.mock('@app/features/ha/useHA', () => ({
  useHA: () => hoisted.ha,
  useFileContent: () => hoisted.file,
  useCreateFile: () => ({ mutateAsync: vi.fn(), isPending: hoisted.creating }),
  useDeployFile: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@app/components/PageBasic', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));

vi.mock('@app/components/OcfAgentEditor', () => ({
  OcfAgentEditor: ({ tomlContent }: { tomlContent: string }) => <div data-testid="editor">{tomlContent}</div>,
}));

const path = 'files/etc/drbd-reactor.d/ha_mysql.toml';

const renderEditor = (url = `/reactor/edit/ha_mysql?filePath=${encodeURIComponent(path)}`) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/reactor/edit/:resourceName" element={<ConfigEditor />} />
        <Route path="/reactor/create" element={<ConfigEditor />} />
      </Routes>
    </MemoryRouter>,
  );

describe('HA ConfigEditor', () => {
  beforeEach(() => {
    hoisted.ha = { data: undefined, isPending: true };
    hoisted.file = { data: undefined, isLoading: true };
    hoisted.creating = false;
  });

  it('shows the shape of the editor, not a spinner, while the config is read', () => {
    const { container } = renderEditor();
    expect(container.querySelector('.ant-skeleton')).not.toBeNull();
    expect(container.querySelector('.ant-spin')).toBeNull();
    expect(screen.queryByTestId('editor')).toBeNull();
  });

  it('opens the editor on the config once it has been read', () => {
    hoisted.ha = { data: [{ name: 'ha_mysql', props: { [path]: '' } }], isPending: false };
    hoisted.file = { data: { data: { path, content: btoa('[[promoter]]') } }, isLoading: false };
    const { container } = renderEditor();
    expect(screen.getByTestId('editor')).toHaveTextContent('[[promoter]]');
    expect(container.querySelector('.ant-skeleton')).toBeNull();
  });

  it('keeps the spinner while a new config is being saved', () => {
    hoisted.creating = true;
    const { container } = renderEditor('/reactor/create');
    expect(container.querySelector('.ant-spin')).not.toBeNull();
    expect(container.querySelector('.ant-skeleton')).toBeNull();
  });

  it('opens a new config at once, without reading anything', () => {
    const { container } = renderEditor('/reactor/create');
    expect(screen.getByTestId('editor')).toBeInTheDocument();
    expect(container.querySelector('.ant-skeleton')).toBeNull();
  });
});
