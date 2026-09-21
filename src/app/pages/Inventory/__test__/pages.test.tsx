// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';

import NodeList from '../Nodes';
import NodeCreate from '../Nodes/create';
import NodeEdit from '../Nodes/edit';
import StoragePoolList from '../StoragePools';
import StoragePoolCreate from '../StoragePools/create';
import StoragePoolEdit from '../StoragePools/edit';
import { renderPage } from './helpers';

// These pages are thin: a translated title plus one feature component. The
// feature components have their own suites, so they are stubbed here and the
// wiring — title, which component, which props — is what gets checked.
vi.mock('@app/components/PageBasic', () => ({
  default: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('@app/features/node/components/List', () => ({
  List: () => <div data-testid="node-list" />,
}));

vi.mock('@app/features/node', () => ({
  CreateNodeForm: ({ editing }: { editing?: boolean }) => <div data-testid="node-form" data-editing={!!editing} />,
}));

vi.mock('@app/features/storagePool', () => ({
  List: () => <div data-testid="storage-pool-list" />,
  StoragePoolCreateForm: () => <div data-testid="storage-pool-create" />,
  StoragePoolEditForm: () => <div data-testid="storage-pool-edit" />,
}));

describe('Inventory pages', () => {
  it('node list', () => {
    renderPage(<NodeList />);
    expect(screen.getByRole('heading', { name: 'Node List' })).toBeInTheDocument();
    expect(screen.getByTestId('node-list')).toBeInTheDocument();
  });

  it('node create renders the form in create mode', () => {
    renderPage(<NodeCreate />);
    expect(screen.getByRole('heading', { name: 'Create Node' })).toBeInTheDocument();
    expect(screen.getByTestId('node-form')).toHaveAttribute('data-editing', 'false');
  });

  it('node edit renders the same form in editing mode', () => {
    renderPage(<NodeEdit />);
    expect(screen.getByRole('heading', { name: 'Edit Node' })).toBeInTheDocument();
    expect(screen.getByTestId('node-form')).toHaveAttribute('data-editing', 'true');
  });

  it('storage pool list', () => {
    renderPage(<StoragePoolList />);
    expect(screen.getByRole('heading', { name: 'Storage Pool List' })).toBeInTheDocument();
    expect(screen.getByTestId('storage-pool-list')).toBeInTheDocument();
  });

  it('storage pool create shows the description above the form', () => {
    renderPage(<StoragePoolCreate />);
    expect(screen.getByRole('heading', { name: 'Add Storage Pool' })).toBeInTheDocument();
    expect(screen.getByTestId('storage-pool-create')).toBeInTheDocument();
  });

  it('storage pool edit', () => {
    renderPage(<StoragePoolEdit />);
    expect(screen.getByRole('heading', { name: 'Edit Storage Pool' })).toBeInTheDocument();
    expect(screen.getByTestId('storage-pool-edit')).toBeInTheDocument();
  });
});
