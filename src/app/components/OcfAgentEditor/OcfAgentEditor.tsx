import { useTranslation } from 'react-i18next';
import type { FormInstance } from 'antd';
import { Form, message, Typography, Tabs } from 'antd';
import React, { useImperativeHandle, useState, forwardRef } from 'react';
import { agentList } from './agentCatalog';
import { AddAgentModal } from './AddAgentModal';
import { AddParameterModal } from './AddParameterModal';
import { AddSystemdModal } from './AddSystemdModal';
import { AgentPreview } from './AgentPreview';
import { DRBDReactorConfig } from './DRBDReactorConfig';
import { EditorToolbar } from './EditorToolbar';
import { MetadataEditor } from './MetadataEditor';
import { PasteTomlModal } from './PasteTomlModal';
import { ServicesPane, type EditorFormChange } from './ServicesPane';
import { SplitView } from './SplitView';
import { TomlPreview } from './TomlPreview';
import type { OcfAgentFormOutput } from './agentForm';
import { generateMetadataString, generateReactorConfigString } from './reactorToml';
import { useAgentList } from './useAgentList';
import { useAgentParams } from './useAgentParams';
import { usePreviewToggle } from './usePreviewToggle';
import { useReactorDocument } from './useReactorDocument';
import { useResourceOptions } from './useResourceOptions';
import { useSplitPane } from './useSplitPane';

const { Text } = Typography;

interface OcfAgentEditorProps {
  // For edit mode
  profile?: { name: string; id: string } | null;
  tomlContent?: string;
  hideTitle?: boolean;
  onSave?: (tomlContent: string, resourceName: string, filePath?: string) => void;
  onCancel?: () => void;

  // For create/wizard mode
  mode?: 'edit' | 'create';
  externalForm?: FormInstance; // External form for create mode
  resources?: { name: string }[]; // Available resources for create mode
  services?: string[]; // Available services for create mode
  onAgentsChange?: (agents: OcfAgentFormOutput[]) => void; // Callback when agents change
  onDirtyChange?: (isDirty: boolean) => void; // Callback when dirty state changes

  // Preview control
  showPreview?: boolean; // Controlled from outside
  onPreviewChange?: (show: boolean) => void; // Callback when preview toggle changes
}

export interface OcfAgentEditorRef {
  togglePreview: () => void;
  isDirty: () => boolean;
}

export const OcfAgentEditor = forwardRef<OcfAgentEditorRef, OcfAgentEditorProps>(function OcfAgentEditor(
  {
    profile,
    tomlContent,
    onSave,
    mode = 'edit',
    externalForm,
    onAgentsChange,
    onDirtyChange,
    showPreview: externalShowPreview,
    onPreviewChange,
  }: OcfAgentEditorProps,
  ref,
) {
  const { t } = useTranslation();
  const currentTheme = 'light'; // Default to light theme
  const [internalForm] = Form.useForm();

  // Use external form in create mode, internal form in edit mode
  const form = externalForm || internalForm;

  const { previewVisible, togglePreview } = usePreviewToggle(externalShowPreview, onPreviewChange);
  const { rdOptions, rdLoading } = useResourceOptions();
  const { leftPanelWidth, handleMouseDown } = useSplitPane();

  const agents = useAgentList(form, t);
  const { parsedAgents, setParsedAgents, allAgents } = agents;
  const params = useAgentParams(parsedAgents, setParsedAgents, allAgents, form, t);
  const doc = useReactorDocument({
    mode,
    profile,
    tomlContent,
    form,
    externalForm,
    onSave,
    onAgentsChange,
    onDirtyChange,
    parsedAgents,
    setParsedAgents,
    setNextInstanceId: agents.setNextInstanceId,
    t,
  });
  const { saving, reactorConfig, metadataConfig, isFormDirty, handleSave } = doc;

  // Form values for live preview
  const [, forceUpdate] = useState({});

  // Add agent modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [addSystemdModalVisible, setAddSystemdModalVisible] = useState(false);

  // Add parameter modal state
  const [addParamModalVisible, setAddParamModalVisible] = useState(false);
  const [currentAgentIndex, setCurrentAgentIndex] = useState<number | null>(null);
  const [selectedParam, setSelectedParam] = useState<string>('');

  // Paste TOML modal state
  const [pasteModalVisible, setPasteModalVisible] = useState(false);

  // Expose methods to parent (must be after togglePreview and isFormDirty are defined)
  useImperativeHandle(
    ref,
    () => ({
      togglePreview,
      isDirty: () => isFormDirty,
    }),
    [togglePreview, isFormDirty],
  );

  const handlePasteConfirm = (pastedToml: string) => {
    if (!pastedToml) {
      setPasteModalVisible(false);
      return false;
    }

    const result = doc.applyTomlContent(pastedToml);
    if (!result) return false;
    message.success(t('common:configuration_applied'));
    setPasteModalVisible(false);
    return true;
  };

  // Sync form changes to parsedAgents immediately
  const handleFormValuesChange = (changedValues: EditorFormChange) => {
    if (changedValues.resource_name && mode === 'create') {
      form.setFieldValue('file_path', changedValues.resource_name);
    }

    if (changedValues.agents) {
      agents.applyAgentValuesChange(changedValues.agents);
    }

    // Trigger preview update
    forceUpdate({});

    // Sync to parent form in create mode
    if (mode === 'create') {
      doc.syncToParentForm();
    }
  };

  // Open add parameter Modal
  // stableKey parameter is the instanceId
  const handleAddParam = (stableKey: number) => {
    setCurrentAgentIndex(stableKey);
    setSelectedParam('');
    setAddParamModalVisible(true);
  };

  const closeAddParamModal = () => {
    setAddParamModalVisible(false);
    setSelectedParam('');
    setCurrentAgentIndex(null);
  };

  // Confirm add parameter
  const confirmAddParam = () => {
    if (currentAgentIndex === null || !selectedParam) {
      message.error(t('common:please_select_parameter'));
      return;
    }
    if (params.addParam(currentAgentIndex, selectedParam)) closeAddParamModal();
  };

  const openAddModal = () => {
    setAddModalVisible(true);
    setSelectedProvider('');
    setSelectedAgent('');
  };

  // Add new agent
  const handleAddAgent = () => {
    if (agents.addAgent(selectedProvider, selectedAgent)) setAddModalVisible(false);
  };

  const handleAddSystemdUnit = (type: 'service' | 'mount', unitName: string) => {
    if (!agents.addSystemdUnit(type, unitName)) return false;
    setAddSystemdModalVisible(false);
    return true;
  };

  const splitView = (editor: React.ReactNode, preview: React.ReactNode) => (
    <SplitView
      editor={editor}
      preview={preview}
      previewVisible={previewVisible}
      leftPanelWidth={leftPanelWidth}
      onResizeStart={handleMouseDown}
    />
  );

  if (mode === 'edit' && !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Text type="secondary">{t('common:no_profile_selected')}</Text>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .ocf-agent-editor .ant-tabs-body,
          .ocf-agent-editor .ant-tabs-content {
            height: 100%;
          }
        `}
      </style>
      <div
        className="ocf-agent-editor sortable-list"
        style={{
          padding: '24px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Tabs
          defaultActiveKey="services"
          tabBarExtraContent={
            <EditorToolbar
              mode={mode}
              isDirty={isFormDirty}
              saving={saving}
              previewVisible={previewVisible}
              onPaste={() => setPasteModalVisible(true)}
              onReset={doc.loadParsedAgents}
              onSave={handleSave}
              onTogglePreview={togglePreview}
            />
          }
          style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          items={[
            {
              key: 'services',
              label: t('common:services'),
              children: splitView(
                <ServicesPane
                  form={form}
                  mode={mode}
                  rdOptions={rdOptions}
                  rdLoading={rdLoading}
                  parsedAgents={parsedAgents}
                  allAgents={allAgents}
                  findAgentMetadata={agents.findAgentMetadata}
                  currentTheme={currentTheme}
                  expandedKeys={agents.expandedKeys}
                  addedParams={params.addedParams}
                  onFinish={handleSave}
                  onValuesChange={handleFormValuesChange}
                  onDragEnd={agents.handleDragEnd}
                  onDelete={agents.deleteAgent}
                  onExpand={agents.toggleExpand}
                  onRemoveParam={params.handleRemoveParam}
                  onAddParam={handleAddParam}
                  onAddSystemd={() => setAddSystemdModalVisible(true)}
                  onAddAgent={openAddModal}
                />,

                <AgentPreview parsedAgents={parsedAgents} loading={saving} currentTheme={currentTheme} />,
              ),
            },

            {
              key: 'reactor',

              label: t('common:drbd_reactor_config'),

              children: splitView(
                <div style={{ height: '100%', overflowY: 'auto', padding: '0 12px 24px 12px' }}>
                  <DRBDReactorConfig
                    initialValues={reactorConfig}
                    onValuesChange={(values) => doc.setReactorConfig(values)}
                  />
                </div>,

                <TomlPreview
                  content={generateReactorConfigString(reactorConfig)}
                  loading={saving}
                  currentTheme={currentTheme}
                />,
              ),
            },

            {
              key: 'metadata',

              label: t('common:metadata'),

              children: splitView(
                <div style={{ height: '100%', overflowY: 'auto', padding: '0 12px 24px 12px' }}>
                  <MetadataEditor
                    initialValues={metadataConfig}
                    onValuesChange={(values) => doc.setMetadataConfig(values)}
                  />
                </div>,

                <TomlPreview
                  content={generateMetadataString(metadataConfig)}
                  loading={saving}
                  currentTheme={currentTheme}
                />,
              ),
            },
          ]}
        />

        {/* Add Agent Modal */}
        <AddAgentModal
          visible={addModalVisible}
          onOk={handleAddAgent}
          onCancel={() => setAddModalVisible(false)}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          selectedAgent={selectedAgent}
          onAgentChange={setSelectedAgent}
          agents={agentList}
        />

        <AddSystemdModal
          open={addSystemdModalVisible}
          onAdd={handleAddSystemdUnit}
          onCancel={() => setAddSystemdModalVisible(false)}
        />

        {/* Add Parameter Modal */}
        <AddParameterModal
          visible={addParamModalVisible}
          onOk={confirmAddParam}
          onCancel={closeAddParamModal}
          currentAgentIndex={currentAgentIndex}
          selectedParam={selectedParam}
          onParamChange={setSelectedParam}
          parsedAgents={parsedAgents}
          allAgents={allAgents}
        />

        {/* Paste TOML Modal */}
        <PasteTomlModal
          open={pasteModalVisible}
          onConfirm={handlePasteConfirm}
          onCancel={() => setPasteModalVisible(false)}
        />
      </div>
    </>
  );
});
