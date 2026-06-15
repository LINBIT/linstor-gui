// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Collapse, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

// Reference: LINSTOR user guide §3.1 "Creating a highly available LINSTOR cluster".
// Content is intentionally English (technical CLI snippets); only the section
// labels go through i18n.

const codeStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.04)',
  padding: '10px 12px',
  borderRadius: 6,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  lineHeight: 1.5,
  overflowX: 'auto',
  margin: '8px 0',
  whiteSpace: 'pre',
};

const CodeBlock: React.FC<{ children: string }> = ({ children }) => <pre style={codeStyle}>{children}</pre>;

const SubHeader: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>
    {children}
  </Typography.Title>
);

const HAGuideBody: React.FC = () => (
  <div>
    <Typography.Paragraph>
      A default LINSTOR cluster runs a single active controller. Making it highly available means giving the controller
      database replicated storage, installing additional standby controller nodes, and letting{' '}
      <Typography.Text code>DRBD Reactor</Typography.Text> mount the shared storage and start the controller on the
      currently-active node.
    </Typography.Paragraph>
    <Typography.Paragraph type="secondary">
      The LINSTOR GUI does not yet automate this setup. Follow the CLI steps below from one of your nodes — they mirror
      the official LINSTOR user guide §3.1.
    </Typography.Paragraph>

    <SubHeader>1. Configure HA database storage</SubHeader>
    <Typography.Paragraph>
      Create a resource group for the controller database. Replace <Typography.Text code>my-thin-pool</Typography.Text>{' '}
      with an existing storage pool name.
    </Typography.Paragraph>
    <CodeBlock>{`linstor resource-group create \\
  --storage-pool my-thin-pool \\
  --place-count 3 \\
  --diskless-on-remaining true \\
  linstor-db-grp`}</CodeBlock>

    <Typography.Paragraph>Apply the DRBD options the controller DB requires:</Typography.Paragraph>
    <CodeBlock>{`linstor resource-group drbd-options \\
  --auto-promote=no \\
  --quorum=majority \\
  --on-suspended-primary-outdated=force-secondary \\
  --on-no-quorum=io-error \\
  --on-no-data-accessible=io-error \\
  linstor-db-grp`}</CodeBlock>

    <Typography.Paragraph>Create a volume group and spawn a 200 MiB DB resource:</Typography.Paragraph>
    <CodeBlock>{`linstor volume-group create linstor-db-grp
linstor resource-group spawn-resources linstor-db-grp linstor_db 200M`}</CodeBlock>

    <SubHeader>2. Move the LINSTOR DB onto the HA storage</SubHeader>
    <Typography.Paragraph>
      Stop and disable the current controller — Reactor will manage it from now on:
    </Typography.Paragraph>
    <CodeBlock>{`systemctl disable --now linstor-controller`}</CodeBlock>

    <Typography.Paragraph>
      Create the mount unit and move the existing DB onto the new DRBD volume:
    </Typography.Paragraph>
    <CodeBlock>{`cat <<'EOF' > /etc/systemd/system/var-lib-linstor.mount
[Unit]
Description=Filesystem for the LINSTOR controller

[Mount]
What=/dev/drbd/by-res/linstor_db/0
Where=/var/lib/linstor
EOF

mv /var/lib/linstor{,.orig}
mkdir /var/lib/linstor
chattr +i /var/lib/linstor              # only on LINSTOR >= 1.14.0
drbdadm primary linstor_db
mkfs.ext4 -b 4096 /dev/drbd/by-res/linstor_db/0
systemctl start var-lib-linstor.mount
cp -r /var/lib/linstor.orig/* /var/lib/linstor
systemctl start linstor-controller`}</CodeBlock>

    <Typography.Paragraph>
      Copy <Typography.Text code>/etc/systemd/system/var-lib-linstor.mount</Typography.Text> to every node that could
      become a controller. <Typography.Text strong>Do not</Typography.Text>{' '}
      <Typography.Text code>systemctl enable</Typography.Text> it — Reactor controls it.
    </Typography.Paragraph>

    <SubHeader>3. Install standby controllers</SubHeader>
    <Typography.Paragraph>
      Install the controller package on every node that has access to the{' '}
      <Typography.Text code>linstor_db</Typography.Text> resource. Verify the service is disabled everywhere:
    </Typography.Paragraph>
    <CodeBlock>{`systemctl disable linstor-controller          # every potential controller
systemctl stop linstor-controller             # every node except the active one
chattr +i /var/lib/linstor                    # only on LINSTOR >= 1.14.0`}</CodeBlock>

    <SubHeader>4. Hand off to DRBD Reactor</SubHeader>
    <Typography.Paragraph>
      Install <Typography.Text code>drbd-reactor</Typography.Text> on every potential controller and configure{' '}
      <Typography.Text code>/etc/drbd-reactor.d/linstor_db.toml</Typography.Text>:
    </Typography.Paragraph>
    <CodeBlock>{`[[promoter]]
[promoter.resources.linstor_db]
start = ["var-lib-linstor.mount", "linstor-controller.service"]`}</CodeBlock>

    <Typography.Paragraph>Restart, enable and check Reactor:</Typography.Paragraph>
    <CodeBlock>{`systemctl restart drbd-reactor
systemctl enable drbd-reactor
systemctl status drbd-reactor
drbd-reactorctl status linstor_db`}</CodeBlock>

    <Typography.Paragraph>
      Finally, tell the satellite to preserve the DB resource across restarts. Edit the unit with{' '}
      <Typography.Text code>systemctl edit linstor-satellite</Typography.Text> and add:
    </Typography.Paragraph>
    <CodeBlock>{`[Service]
Environment=LS_KEEP_RES=linstor_db`}</CodeBlock>
    <Typography.Paragraph>Restart the satellite on every node:</Typography.Paragraph>
    <CodeBlock>{`systemctl restart linstor-satellite`}</CodeBlock>

    <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
      Configure your LINSTOR client and integrations (Proxmox, CSI, …) for multiple controllers — see the LINSTOR user
      guide for the full reference.
    </Typography.Paragraph>
  </div>
);

export const HASetupGuide: React.FC = () => {
  const { t } = useTranslation(['clusterSetup']);

  return (
    <div style={{ marginTop: 24 }}>
      <Typography.Title level={4} style={{ marginBottom: 6 }}>
        {t('clusterSetup:further_tasks')}
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        {t('clusterSetup:further_tasks_intro')}
      </Typography.Paragraph>

      <Collapse
        items={[
          {
            key: 'ha',
            label: t('clusterSetup:ha_guide_label'),
            children: <HAGuideBody />,
          },
        ]}
      />
    </div>
  );
};
