import React from 'react';
import { useParams } from 'react-router-dom';
import { useRequest } from 'ahooks';

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTermHelpText,
  DescriptionListTermHelpTextButton,
  List,
  ListItem,
} from '@patternfly/react-core';

import PageBasic from '@app/components/PageBasic';
import { useTranslation } from 'react-i18next';
import CheckboxActionDataList from './components/NetInterface';

const NodeDetail: React.FC = () => {
  const { t } = useTranslation('node');
  const { node } = useParams() as { node: string };

  const nodeInfo = useRequest(`/v1/nodes?nodes=${node}`);
  const nodeInterfaceInfo = useRequest(`/v1/nodes/${node}/net-interfaces`);
  const nodeStoragePoolInfo = useRequest(`/v1/nodes/${node}/storage-pools`);

  const nodeData = nodeInfo.data ? nodeInfo.data[0] : {};
  const loading = nodeInfo.loading || nodeInterfaceInfo.loading || nodeStoragePoolInfo.loading;

  return (
    <PageBasic title={t('node_detail')} loading={loading}>
      <DescriptionList
        columnModifier={{
          default: '2Col',
        }}
      >
        <DescriptionListGroup>
          <DescriptionListTermHelpText>
            <DescriptionListTermHelpTextButton> Name </DescriptionListTermHelpTextButton>
          </DescriptionListTermHelpText>
          <DescriptionListDescription>{node}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTermHelpText>
            <DescriptionListTermHelpTextButton> Connection Status </DescriptionListTermHelpTextButton>
          </DescriptionListTermHelpText>
          <DescriptionListDescription>{nodeData?.connection_status}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTermHelpText>
            <DescriptionListTermHelpTextButton> Type </DescriptionListTermHelpTextButton>
          </DescriptionListTermHelpText>
          <DescriptionListDescription>{nodeData?.type}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTermHelpText>
            <DescriptionListTermHelpTextButton> UUID </DescriptionListTermHelpTextButton>
          </DescriptionListTermHelpText>
          <DescriptionListDescription>{nodeData?.uuid}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTermHelpText>
            <DescriptionListTermHelpTextButton> Resource Layers </DescriptionListTermHelpTextButton>
          </DescriptionListTermHelpText>
          <DescriptionListDescription>
            <List aria-label="Resource Layers List">
              {nodeData?.resource_layers?.map((e) => (
                <ListItem key={e}>{e}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTermHelpText>
            <DescriptionListTermHelpTextButton> Storage Providers </DescriptionListTermHelpTextButton>
          </DescriptionListTermHelpText>
          <DescriptionListDescription>
            <List aria-label="Resource Layers List">
              {nodeData?.storage_providers?.map((e) => (
                <ListItem key={e}>{e}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        {nodeData?.props &&
          Object.keys(nodeData?.props).map((key) => {
            return (
              <DescriptionListGroup key={key}>
                <DescriptionListTermHelpText>
                  <DescriptionListTermHelpTextButton> {key} </DescriptionListTermHelpTextButton>
                </DescriptionListTermHelpText>
                <DescriptionListDescription>{nodeData?.props[key]}</DescriptionListDescription>
              </DescriptionListGroup>
            );
          })}
        <DescriptionListGroup>
          <DescriptionListTermHelpText>
            <DescriptionListTermHelpTextButton> Net Interfaces </DescriptionListTermHelpTextButton>
          </DescriptionListTermHelpText>
          <DescriptionListDescription>
            <CheckboxActionDataList list={nodeInterfaceInfo?.data} />
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </PageBasic>
  );
};

export default NodeDetail;
