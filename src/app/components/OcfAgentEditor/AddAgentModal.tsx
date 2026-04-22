import React, { useMemo, useState } from 'react';
import { Modal, Input, Table } from 'antd';
import { Button } from '@app/components/Button';
import { SearchOutlined } from '@ant-design/icons';

interface ResourceAgentsByProvider {
  providers: Record<
    string,
    Array<{
      name: string;
      shortdesc?: string;
      longdesc?: string;
    }>
  >;
}

interface AddAgentModalProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  selectedAgent: string;
  onAgentChange: (agent: string) => void;
  allAgents: ResourceAgentsByProvider | null;
}

export function AddAgentModal({
  visible,
  onOk,
  onCancel,
  selectedProvider,
  onProviderChange,
  selectedAgent,
  onAgentChange,
  allAgents,
}: AddAgentModalProps) {
  const [searchText, setSearchText] = useState('');

  const dataSource = useMemo(() => {
    if (!allAgents) return [];
    const all = Object.entries(allAgents.providers).flatMap(([provider, agents]) =>
      agents.map((agent) => ({
        key: `${provider}:${agent.name}`,
        provider,
        name: agent.name,
        description: agent.shortdesc || agent.longdesc || '',
      })),
    );

    if (!searchText) return all;

    const lowerSearch = searchText.toLowerCase();
    return all.filter(
      (item) =>
        item.provider.toLowerCase().includes(lowerSearch) ||
        item.name.toLowerCase().includes(lowerSearch) ||
        item.description.toLowerCase().includes(lowerSearch),
    );
  }, [allAgents, searchText]);

  const columns = [
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
      width: 120,
      sorter: (a: any, b: any) => a.provider.localeCompare(b.provider),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  const rowSelection = {
    type: 'radio' as const,
    selectedRowKeys: selectedProvider && selectedAgent ? [`${selectedProvider}:${selectedAgent}`] : [],
    onChange: (selectedRowKeys: React.Key[]) => {
      const key = selectedRowKeys[0] as string;
      if (key) {
        const [p, a] = key.split(':');
        onProviderChange(p);
        onAgentChange(a);
      }
    },
  };

  const handleCancel = () => {
    setSearchText('');
    onCancel();
  };

  const handleOk = () => {
    setSearchText('');
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
