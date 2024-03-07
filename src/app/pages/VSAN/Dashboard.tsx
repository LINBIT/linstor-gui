import React from 'react';
import { Card, Col, Row } from 'antd';

import PageBasic from '@app/components/PageBasic';
import { VSANNodeList } from '@app/features/node';
import { ISCSIList, NVMeoFList, NFSExportList } from '@app/features/vsan';
import { useHistory } from 'react-router-dom';

export const Dashboard = () => {
  const history = useHistory();
  return (
    <PageBasic title="Dashboard">
      <Card title="Nodes" size="small">
        <VSANNodeList />
      </Card>

      <br />

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title="iSCSI Targets"
            size="small"
            style={{ minHeight: 200 }}
            extra={
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  history.push('/vsan/iscsi');
                }}
              >
                Detail
              </a>
            }
          >
            <ISCSIList />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="NVMe-oF Targets"
            style={{ minHeight: 200 }}
            size="small"
            extra={
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  history.push('/vsan/nvmeof');
                }}
              >
                Detail
              </a>
            }
          >
            <NVMeoFList />
          </Card>
        </Col>
      </Row>

      <br />

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title="NFS Targets"
            size="small"
            style={{ minHeight: 200 }}
            extra={
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  history.push('/vsan/nfs');
                }}
              >
                Detail
              </a>
            }
          >
            <NFSExportList />
          </Card>
        </Col>
      </Row>
    </PageBasic>
  );
};
