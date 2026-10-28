// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import PageBasic from '@app/components/PageBasic';

import { Modal } from 'antd';
import { Input } from '@app/components/Input';

export const About = () => {
  const { t } = useTranslation();
  const [hostModal, setHostModal] = useState(false);
  const [host, setHost] = useState(() => {
    return window.localStorage.getItem('HCI_VSAN_HOST') || '';
  });

  const handleSetHost = () => {
    window.localStorage.setItem('HCI_VSAN_HOST', host);
    window.location.reload();
  };

  return (
    <PageBasic title={t('common:about_linbit_vsan')}>
      <p>{t('vsan:about_created_by')}</p>
      <h2>{t('vsan:about_gui_version')}</h2>
      <p
        onClick={() => {
          if (import.meta.env.VITE_VERSION?.indexOf('DEV') !== -1) {
            setHostModal(true);
          }
        }}
      >
        {import.meta.env.VITE_VERSION ? import.meta.env.VITE_VERSION : 'DEV'}
      </p>
      <h2>{t('vsan:about_open_source')}</h2>
      <p>{t('vsan:about_open_source_1')}</p>
      <p>{t('vsan:about_open_source_2')}</p>
      <h2>{t('vsan:about_components')}</h2>
      <p>{t('vsan:about_components_intro')}</p>
      <ul className="list-disc pl-8">
        <li>linstor-appliance, proprietary</li>
        <li>
          linstor-gateway,{' '}
          <a target="_blank" href="https://opensource.org/licenses/GPL-3.0" rel="noreferrer">
            GPLv3
          </a>
        </li>
        <li>
          linstor-controller,{' '}
          <a target="_blank" href="https://opensource.org/licenses/GPL-3.0" rel="noreferrer">
            GPLv3
          </a>
        </li>
        <li>
          linstor-satellite,{' '}
          <a target="_blank" href="https://opensource.org/licenses/GPL-3.0" rel="noreferrer">
            GPLv3
          </a>
        </li>
        <li>
          linstor-client,{' '}
          <a target="_blank" href="https://opensource.org/licenses/GPL-3.0" rel="noreferrer">
            GPLv3
          </a>
        </li>
        <li>
          linstor-common,{' '}
          <a target="_blank" href="https://opensource.org/licenses/GPL-3.0" rel="noreferrer">
            GPLv3
          </a>
        </li>
        <li>
          python-linstor,{' '}
          <a target="_blank" href="https://opensource.org/licenses/GPL-3.0" rel="noreferrer">
            GPLv3
          </a>
        </li>
        <li>
          drbd-utils,{' '}
          <a target="_blank" href="https://opensource.org/licenses/GPL-2.0" rel="noreferrer">
            GPLv2
          </a>
        </li>
        <li>
          kmod-drbd,{' '}
          <a target="_blank" href="https://opensource.org/licenses/GPL-3.0" rel="noreferrer">
            GPLv2
          </a>
        </li>
      </ul>
      <p>
        <Trans
          i18nKey="vsan:about_source_code"
          components={{ 1: <a target="_blank" href="https://github.com/LINBIT" rel="noreferrer" /> }}
        />
      </p>
      <p>
        <Trans
          i18nKey="vsan:about_based_on"
          components={{ 1: <a target="_blank" href="https://almalinux.org/" rel="noreferrer" /> }}
        />
      </p>
      <h2>{t('vsan:about_authors')}</h2>
      <p>{t('vsan:about_authors_intro')}</p>
      <ul className="list-disc pl-8">
        <li>Christoph Böhmwalder - DRBD, linstor-gateway, linstor-appliance, frontend, packaging, testing</li>
        <li>Rene Peinthor - LINSTOR, linstor-appliance</li>
        <li>Gábor Hernádi - LINSTOR mastermind</li>
        <li>Joel Colledge - fullstack LINSTOR &amp; DRBD</li>
        <li>Robert Altnöder - LINSTOR, linstor-gateway</li>
        <li>Johanna Kucera - linstor-appliance frontend</li>
        <li>Roland Kammerer - DRBD, packaging, building, developer infrastructure and more</li>
        <li>Lars Ellenberg - DRBD guru</li>
        <li>Philipp Reisner - DRBD and leading</li>
      </ul>

      <Modal
        title={t('common:vsan_host')}
        open={hostModal}
        onOk={() => {
          handleSetHost();
        }}
        onCancel={() => setHostModal(false)}
      >
        <span>{t('vsan:debug_host', { name: 'VSAN' })}</span>:
        <br />
        <Input value={host} onChange={(evt) => setHost(evt.target.value)} placeholder="https://192.168.0.1:1443" />
      </Modal>
    </PageBasic>
  );
};
