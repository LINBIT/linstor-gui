import React, { useMemo, useState } from 'react';
import { Modal, Select, Table, Tag } from 'antd';
import { Input } from '@app/components/Input';
import { Button } from '@app/components/Button';
import { SearchOutlined } from '@ant-design/icons';

import {
  AGENT_PLATFORM_LABELS,
  AgentPlatform,
  CatalogAgent,
  DEFAULT_AGENT_PLATFORMS,
  agentKey,
  availablePlatforms,
  filterAgentsByPlatform,
} from './agentCatalog';

interface AddAgentModalProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  selectedAgent: string;
  onAgentChange: (agent: string) => void;
  agents: CatalogAgent[] | null;
}

const PLATFORM_COLORS: Record<AgentPlatform, string> = {
  linux: 'blue',
  windows: 'geekblue',
};

export function AddAgentModal({
  visible,
  onOk,
  onCancel,
  selectedProvider,
  onProviderChange,
  selectedAgent,
  onAgentChange,
  agents,
}: AddAgentModalProps) {
  const [searchText, setSearchText] = useState('');
  // Linux only until Windows is ticked, so a Linux cluster is never offered
  // agents it cannot run.
  const [platforms, setPlatforms] = useState<AgentPlatform[]>(DEFAULT_AGENT_PLATFORMS);

  const platformOptions = useMemo(
    () =>
      availablePlatforms(agents ?? []).map((platform) => ({
        label: AGENT_PLATFORM_LABELS[platform],
        value: platform,
      })),
    [agents],
  );

  const dataSource = useMemo(() => {
    if (!agents) return [];
    const rows = filterAgentsByPlatform(agents, platforms).map((agent) => ({
      key: agentKey(agent),
      platform: agent.platform,
      provider: agent.provider,
      name: agent.name,
      description: agent.shortdesc || agent.longdesc || '',
    }));

    if (!searchText) return rows;

    const lowerSearch = searchText.toLowerCase();
    return rows.filter(
      (item) =>
        item.provider.toLowerCase().includes(lowerSearch) ||
        item.name.toLowerCase().includes(lowerSearch) ||
        item.description.toLowerCase().includes(lowerSearch),
    );
  }, [agents, platforms, searchText]);

  const columns = [
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      width: 110,
      sorter: (a: { platform: AgentPlatform }, b: { platform: AgentPlatform }) => a.platform.localeCompare(b.platform),
      render: (platform: AgentPlatform) => (
        <Tag color={PLATFORM_COLORS[platform]}>{AGENT_PLATFORM_LABELS[platform]}</Tag>
      ),
    },
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
      width: 120,
      sorter: (a: { provider: string }, b: { provider: string }) => a.provider.localeCompare(b.provider),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      sorter: (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  // The caller tracks provider+name, which is what an ocf: line carries; the
  // key adds the platform so the two catalogs cannot collide in the table.
  const selectedKey = dataSource.find((row) => row.provider === selectedProvider && row.name === selectedAgent)?.key;

  const rowSelection = {
    type: 'radio' as const,
    selectedRowKeys: selectedKey ? [selectedKey] : [],
    onChange: (selectedRowKeys: React.Key[]) => {
      const row = dataSource.find((item) => item.key === selectedRowKeys[0]);
      if (row) {
        onProviderChange(row.provider);
        onAgentChange(row.name);
      }
    },
  };

  const reset = () => {
    setSearchText('');
    setPlatforms(DEFAULT_AGENT_PLATFORMS);
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleOk = () => {
    reset();
    onOk();
  };

  return (
    <Modal
      title="Add Resource Agent"
      open={visible}
      onCancel={handleCancel}
      width={800}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="ok" type="primary" onClick={handleOk} disabled={!selectedAgent}>
          Add
        </Button>,
      ]}
    >
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Select
          mode="multiple"
          allowClear
          value={platforms}
          onChange={setPlatforms}
          options={platformOptions}
          placeholder="Select a platform"
          aria-label="Filter by platform"
          style={{ width: '100%' }}
        />

        <Table
          size="small"
          dataSource={dataSource}
          columns={columns}
          rowSelection={rowSelection}
          pagination={{ pageSize: 10, simple: true, showSizeChanger: false }}
          scroll={{ y: 350 }}
          onRow={(record) => ({
            onClick: () => {
              onProviderChange(record.provider);
              onAgentChange(record.name);
            },
          })}
        />

        <Input
          placeholder="Search agents by provider, name or description..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>
    </Modal>
  );
}
