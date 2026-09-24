// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { createRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Form, message } from 'antd';

import { OcfAgentEditor, OcfAgentEditorRef } from '../OcfAgentEditor';

const hoisted = vi.hoisted(() => ({
  rds: [
    { name: 'r1', props: {} },
    { name: 'r2', props: { 'files/etc/drbd-reactor.d/r2.toml': 'x' } },
  ],
}));

vi.mock('@app/features/ha/useHA', () => ({
  useAllResourceDefinitions: () => ({ data: { data: hoisted.rds }, isLoading: false }),
}));

vi.mock('@app/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const TOML = `[[promoter]]
[promoter.metadata]
name = "web"

[promoter.resources.r1]
on-drbd-demote-failure = "reboot"
runner = "systemd"
start = [
  "ocf:heartbeat:IPaddr2 vip ip=10.0.0.5 cidr_netmask=24",
  "mysql.service",
]
`;

const SAVED_HEAD = '[[promoter]]\n\n[promoter.metadata]\nname = "web"\n\n[promoter.resources.r1]\n';
const SAVED_REACTOR = 'on-drbd-demote-failure = "reboot"\nrunner = "systemd"\n';

type Props = Partial<React.ComponentProps<typeof OcfAgentEditor>>;

const renderEditor = (props: Props = {}) => {
  const ref = createRef<OcfAgentEditorRef>();
  const onSave = vi.fn();
  const utils = render(
    <OcfAgentEditor
      ref={ref}
      mode="edit"
      profile={{ name: 'r1', id: 'r1' }}
      tomlContent={TOML}
      onSave={onSave}
      {...props}
    />,
  );
  return { ...utils, ref, onSave };
};

const items = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.sortable-agent-item')) as HTMLElement[];

const expand = (item: HTMLElement) => fireEvent.click(item.querySelector('.anticon-caret-right') as HTMLElement);

// antd icon buttons carry the icon's aria-label in front of the text ("save Save").
const toolbar = (name: string) =>
  screen.getByRole('button', { name: new RegExp(`${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}$`) });

// antd renders each option twice (a11y listbox and the visible item); click the visible one.
const pickOption = async (title: string, match: '=' | '^=' = '=') => {
  const option = await waitFor(() => {
    const found = document.querySelector(`.ant-select-item[title${match}"${title}"] .ant-select-item-option-content`);
    expect(found).not.toBeNull();
    return found as HTMLElement;
  });
  fireEvent.click(option);
};

// Inactive tab panes stay in the DOM, so read the preview of the active one only.
const previewText = () => {
  const el = document.querySelector(
    '.ant-tabs-tabpane-active .ant-spin-nested-loading div[style*="monospace"]',
  ) as HTMLElement | null;
  return el?.textContent ?? null;
};

const waitForItems = async (container: HTMLElement, count: number) => {
  await waitFor(() => expect(items(container)).toHaveLength(count));
  return items(container);
};

const openAgentPicker = async (name: string) => {
  fireEvent.click(toolbar('Add Resource Agent'));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByPlaceholderText('Search agents by provider, name or description...'), {
    target: { value: name },
  });
  const row = await waitFor(() => {
    const found = Array.from(dialog.querySelectorAll('tbody tr.ant-table-row')).find((tr) =>
      tr.querySelectorAll('td')[3]?.textContent?.startsWith(name),
    );
    expect(found).toBeDefined();
    return found as HTMLElement;
  });
  fireEvent.click(row);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
};

const addUnit = async (name: string, type?: 'Mount') => {
  fireEvent.click(toolbar('Add Systemd/Mount'));
  const dialog = await screen.findByRole('dialog');
  if (type) {
    fireEvent.mouseDown(within(dialog).getByRole('combobox'));
    await pickOption(type);
  }
  fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: name } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
};

describe('OcfAgentEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    message.destroy();
  });

  it('asks for a profile in edit mode', () => {
    render(<OcfAgentEditor mode="edit" profile={null} />);
    expect(screen.getByText('No profile selected')).toBeInTheDocument();
  });

  it('parses the start array into agents and units and previews it', async () => {
    const { container, ref } = renderEditor();
    const [first, second] = await waitForItems(container, 2);

    expect(first).toHaveTextContent('#1');
    expect(first).toHaveTextContent('OCF');
    expect(first).toHaveTextContent('IPaddr2');
    expect(first).toHaveTextContent('vip');
    expect(second).toHaveTextContent('#2');
    expect(second).toHaveTextContent('systemd');
    expect(second).toHaveTextContent('mysql.service');

    expect(toolbar('Save')).toBeDisabled();
    expect(toolbar('Reset')).toBeDisabled();
    expect(ref.current?.isDirty()).toBe(false);
    expect(previewText()).toBeNull();

    fireEvent.click(toolbar('Preview'));
    expect(previewText()).toBe(
      'start = [\n    "ocf:heartbeat:IPaddr2 vip ip=10.0.0.5 cidr_netmask=24",\n    "mysql.service"\n  ]',
    );
    expect(screen.getByTitle('Drag to resize')).toBeInTheDocument();

    ref.current?.togglePreview();
    await waitFor(() => expect(previewText()).toBeNull());
  });

  it('follows an external preview flag and reports toggles', async () => {
    const onPreviewChange = vi.fn();
    const { container, rerender } = renderEditor({ showPreview: false, onPreviewChange });
    await waitForItems(container, 2);
    expect(previewText()).toBeNull();

    rerender(
      <OcfAgentEditor
        mode="edit"
        profile={{ name: 'r1', id: 'r1' }}
        tomlContent={TOML}
        showPreview
        onPreviewChange={onPreviewChange}
      />,
    );
    await waitFor(() => expect(previewText()).not.toBeNull());

    fireEvent.click(toolbar('Preview'));
    expect(onPreviewChange).toHaveBeenCalledWith(false);
    expect(previewText()).toBeNull();
  });

  it('edits a parameter and saves the regenerated TOML', async () => {
    const onDirtyChange = vi.fn();
    const { container, onSave, ref } = renderEditor({ onDirtyChange });
    const [first] = await waitForItems(container, 2);

    expand(first);
    expect(first).toHaveTextContent('ocf:heartbeat:IPaddr2 vip ip=10.0.0.5 cidr_netmask=24');
    expect(within(first).getByText('Parameters')).toBeInTheDocument();
    const inputs = within(first).getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs.map((input) => input.value)).toEqual(['10.0.0.5', '24']);

    fireEvent.change(inputs[0], { target: { value: '10.0.0.6' } });

    expect(first).toHaveTextContent('ocf:heartbeat:IPaddr2 vip ip=10.0.0.6 cidr_netmask=24');
    await waitFor(() => expect(toolbar('Save')).toBeEnabled());
    expect(ref.current?.isDirty()).toBe(true);
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(toolbar('Save'));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      SAVED_HEAD +
        SAVED_REACTOR +
        'start = [\n  "ocf:heartbeat:IPaddr2 vip ip=10.0.0.6 cidr_netmask=24",\n  "mysql.service",\n]\n',
      'r1',
      undefined,
    );
  });

  it('adds, toggles and removes parameters from the catalog', async () => {
    const { container } = renderEditor();
    const [first] = await waitForItems(container, 2);
    expand(first);
    fireEvent.click(toolbar('Preview'));

    fireEvent.click(within(first).getByRole('button', { name: /Add Parameter/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.mouseDown(within(dialog).getByRole('combobox'));
    await pickOption('lvs_support ', '^=');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Parameter lvs_support added')).toBeInTheDocument();
    expect(previewText()).toContain('lvs_support=false');
    const toggle = within(first).getByRole('switch');
    expect(toggle).not.toBeChecked();

    fireEvent.click(toggle);
    await waitFor(() => expect(previewText()).toContain('lvs_support=true'));

    const removeButtons = first.querySelectorAll('.anticon-minus-circle');
    fireEvent.click(removeButtons[removeButtons.length - 1].closest('button') as HTMLElement);
    expect(await screen.findByText('Parameter lvs_support removed')).toBeInTheDocument();
    await waitFor(() => expect(previewText()).not.toContain('lvs_support'));
    expect(within(first).queryByRole('switch')).toBeNull();
  });

  it('adds systemd and mount units with the right suffix', async () => {
    const { container, onSave } = renderEditor();
    await waitForItems(container, 2);

    fireEvent.click(toolbar('Add Systemd/Mount'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
    expect(await screen.findByText('Please enter a unit name')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'nginx' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
    expect(await screen.findByText('Added service unit: nginx.service')).toBeInTheDocument();
    let all = await waitForItems(container, 3);
    expect(all[2]).toHaveTextContent('nginx.service');
    expect(within(all[2]).getByText('Systemd Unit Configuration')).toBeInTheDocument();

    await addUnit('var-lib-mysql', 'Mount');
    expect(await screen.findByText('Added mount unit: var-lib-mysql.mount')).toBeInTheDocument();
    all = await waitForItems(container, 4);
    expect(all[3]).toHaveTextContent('var-lib-mysql.mount');

    const unitInput = within(all[2]).getByRole('textbox') as HTMLInputElement;
    expect(unitInput.value).toBe('nginx.service');
    fireEvent.change(unitInput, { target: { value: 'nginx2.service' } });

    fireEvent.click(toolbar('Save'));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toContain(
      'start = [\n  "ocf:heartbeat:IPaddr2 vip ip=10.0.0.5 cidr_netmask=24",\n  "mysql.service",\n  "nginx2.service",\n  "var-lib-mysql.mount",\n]\n',
    );
  });

  it('adds a resource agent from the catalog and insists on its required parameters', async () => {
    const { container, onSave } = renderEditor();
    await waitForItems(container, 2);

    await openAgentPicker('Filesystem');
    expect(await screen.findByText('Added OCF agent: heartbeat:Filesystem')).toBeInTheDocument();
    const all = await waitForItems(container, 3);
    expect(all[2]).toHaveTextContent('Filesystem_new');
    const required = within(all[2]).getAllByRole('textbox') as HTMLInputElement[];
    expect(required).toHaveLength(3);
    expect(required.map((input) => input.value)).toEqual(['', '', '']);

    fireEvent.click(toolbar('Save'));
    expect(await screen.findByText('Please fix validation errors')).toBeInTheDocument();
    expect(await screen.findByText('device is required')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(required[0], { target: { value: '/dev/drbd1000' } });
    fireEvent.change(required[1], { target: { value: '/mnt/data' } });
    fireEvent.change(required[2], { target: { value: 'ext4' } });
    fireEvent.click(toolbar('Save'));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toContain(
      '  "ocf:heartbeat:Filesystem Filesystem_new device=/dev/drbd1000 directory=/mnt/data fstype=ext4",\n]\n',
    );
  });

  it('deletes an item after confirmation and renumbers the rest', async () => {
    const { container } = renderEditor();
    const [first] = await waitForItems(container, 2);

    fireEvent.click(first.querySelector('.anticon-delete')?.closest('button') as HTMLElement);
    expect(await screen.findByText('Delete this item?')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));

    expect(await screen.findByText('Agent removed')).toBeInTheDocument();
    const rest = await waitForItems(container, 1);
    expect(rest[0]).toHaveTextContent('#1');
    expect(rest[0]).toHaveTextContent('mysql.service');
    expect(toolbar('Save')).toBeEnabled();
  });

  it('resets to the loaded content', async () => {
    const { container } = renderEditor();
    await waitForItems(container, 2);

    await addUnit('extra');
    await waitForItems(container, 3);
    expect(toolbar('Reset')).toBeEnabled();

    fireEvent.click(toolbar('Reset'));
    await waitForItems(container, 2);
    await waitFor(() => expect(toolbar('Save')).toBeDisabled());
  });

  it('replaces the content from pasted TOML and rejects garbage', async () => {
    const { container } = renderEditor();
    await waitForItems(container, 2);

    fireEvent.click(toolbar('Paste'));
    let dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'start = [oops' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
    expect(await screen.findByText('Failed to parse configuration content')).toBeInTheDocument();
    expect(items(container)).toHaveLength(2);

    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: '[[promoter]]\n[promoter.resources.r1]\nstart = ["ocf:heartbeat:Dummy d1 state=/tmp/x"]\n' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
    expect(await screen.findByText('Configuration applied')).toBeInTheDocument();
    const rest = await waitForItems(container, 1);
    expect(rest[0]).toHaveTextContent('Dummy');
    expect(rest[0]).toHaveTextContent('d1');

    fireEvent.click(toolbar('Paste'));
    dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
    await waitFor(() => {
      const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
      expect(!wrap || wrap.style.display === 'none').toBe(true);
    });
  });

  it('edits the reactor options on their own tab', async () => {
    const { container, onSave } = renderEditor();
    await waitForItems(container, 2);

    fireEvent.click(screen.getByRole('tab', { name: 'DRBD Reactor Config' }));
    expect(await screen.findByText('On DRBD Demote Failure')).toBeInTheDocument();
    expect(screen.getByText('reboot')).toBeInTheDocument();
    expect(screen.getByText('Runner')).toBeInTheDocument();

    fireEvent.click(toolbar('Preview'));
    expect(previewText()).toBe('on-drbd-demote-failure = "reboot"\nrunner = "systemd"');

    fireEvent.click(screen.getByRole('button', { name: /Add Configuration/ }));
    fireEvent.click(within(await screen.findByRole('menu')).getByText('On Quorum Loss'));
    const selects = screen.getAllByRole('combobox');
    fireEvent.mouseDown(selects[selects.length - 1]);
    await pickOption('freeze');

    await waitFor(() => expect(previewText()).toContain('on-quorum-loss = "freeze"'));
    fireEvent.click(toolbar('Save'));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    // The reactor tab reports its fields in catalog order, not in the order the file had them.
    expect(onSave.mock.calls[0][0]).toContain(
      'runner = "systemd"\non-drbd-demote-failure = "reboot"\non-quorum-loss = "freeze"\nstart = [',
    );
  });

  it('edits the metadata on its own tab', async () => {
    const { container, onSave } = renderEditor();
    await waitForItems(container, 2);

    fireEvent.click(screen.getByRole('tab', { name: 'Metadata' }));
    const key = (await screen.findAllByPlaceholderText('Key'))[0] as HTMLInputElement;
    expect(key.value).toBe('name');
    expect((screen.getAllByPlaceholderText('Value')[0] as HTMLInputElement).value).toBe('web');

    fireEvent.click(toolbar('Preview'));
    expect(previewText()).toBe('name = "web"');

    fireEvent.click(screen.getByRole('button', { name: /Add Metadata/ }));
    const keys = await screen.findAllByPlaceholderText('Key');
    fireEvent.change(keys[1], { target: { value: 'tier' } });
    fireEvent.change(screen.getAllByPlaceholderText('Value')[1], { target: { value: 'db' } });

    await waitFor(() => expect(previewText()).toBe('name = "web"\ntier = "db"'));
    fireEvent.click(toolbar('Save'));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toContain('[promoter.metadata]\nname = "web"\ntier = "db"\n\n');
  });

  it('shows the empty state for a profile without content', async () => {
    renderEditor({ tomlContent: '' });
    expect(await screen.findByText('No OCF agents found in start array')).toBeInTheDocument();
  });

  describe('create mode', () => {
    const CreateHost = ({
      onSave,
      onAgentsChange,
    }: {
      onSave: (toml: string, name: string, path?: string) => void;
      onAgentsChange: (agents: unknown[]) => void;
    }) => {
      const [form] = Form.useForm();
      return <OcfAgentEditor mode="create" externalForm={form} onSave={onSave} onAgentsChange={onAgentsChange} />;
    };

    const renderCreate = () => {
      const onSave = vi.fn();
      const onAgentsChange = vi.fn();
      const utils = render(<CreateHost onSave={onSave} onAgentsChange={onAgentsChange} />);
      return { ...utils, onSave, onAgentsChange };
    };

    it('offers resources without a reactor file and derives the file name', async () => {
      const { onSave } = renderCreate();
      expect(await screen.findByText('No OCF agents found in start array')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();

      fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
      await waitFor(() => expect(document.querySelector('.ant-select-item[title="r1"]')).not.toBeNull());
      expect(document.querySelector('.ant-select-item[title="r2"]')).toBeNull();
      fireEvent.click(document.querySelector('.ant-select-item[title="r1"]') as HTMLElement);

      const filePath = screen.getByPlaceholderText('my-resource') as HTMLInputElement;
      await waitFor(() => expect(filePath.value).toBe('r1'));

      await addUnit('app');
      await waitFor(() => expect(toolbar('Save')).toBeEnabled());
      fireEvent.click(toolbar('Save'));
      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      expect(onSave).toHaveBeenCalledWith(
        '[[promoter]]\n\n[promoter.resources.r1]\nstart = [\n  "app.service",\n]\n',
        'r1',
        '/etc/drbd-reactor.d/r1.toml',
      );
    });

    it('loads OCF agents the outer form already holds, params given as a record', async () => {
      const onAgentsChange = vi.fn();
      const Seeded = () => {
        const [form] = Form.useForm();
        form.setFieldValue('ocf_agents', [
          {
            type: 'ocf',
            provider: 'heartbeat',
            agent_type: 'Filesystem',
            instance_name: 'fs_data',
            params: { device: '/dev/drbd1000', directory: '/srv/data' },
          },
        ]);
        return <OcfAgentEditor mode="create" externalForm={form} onSave={vi.fn()} onAgentsChange={onAgentsChange} />;
      };
      const { container } = render(<Seeded />);

      // A record of params used to reach paramsToRecord as-is and throw.
      await waitForItems(container, 1);
      // Written back as the entry list this editor always writes.
      await waitFor(() =>
        expect(onAgentsChange).toHaveBeenLastCalledWith([
          {
            name: 'ocf:heartbeat:Filesystem',
            instance_name: 'fs_data',
            params: [
              { key: 'device', value: '/dev/drbd1000' },
              { key: 'directory', value: '/srv/data' },
            ],
          },
        ]),
      );
    });

    it('refuses to save without a resource and syncs OCF agents to the outer form', async () => {
      const { container, onSave, onAgentsChange } = renderCreate();
      await screen.findByText('No OCF agents found in start array');

      await openAgentPicker('Filesystem');
      await waitForItems(container, 1);
      await waitFor(() =>
        expect(onAgentsChange).toHaveBeenLastCalledWith([
          {
            name: 'ocf:heartbeat:Filesystem',
            instance_name: 'Filesystem_new',
            params: [
              { key: 'device', value: '' },
              { key: 'directory', value: '' },
              { key: 'fstype', value: '' },
            ],
          },
        ]),
      );

      fireEvent.click(toolbar('Save'));
      expect(await screen.findByText('Please fix validation errors')).toBeInTheDocument();
      expect(await screen.findByText('Please select resource')).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
