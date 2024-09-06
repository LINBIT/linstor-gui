// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import PageBasic from '@app/components/PageBasic';
import React, { useState } from 'react';
import { StyledUL } from './styled';
import { Input, Modal } from 'antd';

export const About = () => {
  const [hostModal, setHostModal] = useState(false);
  const [host, setHost] = useState(() => {
    return window.localStorage.getItem('VSAN_HOST') || '';
  });

  const handleSetHost = () => {
    window.localStorage.setItem('VSAN_HOST', host);
    window.location.reload();
  };

  return (
    <PageBasic title="About LINBIT VSAN">
      <p>This product was proudly created by LINBIT.</p>
      <h2>GUI version</h2>
      <p
        onClick={() => {
          if (process.env.VERSION?.indexOf('DEV') !== -1) {
            setHostModal(true);
          }
        }}
      >
        {process.env.VERSION ? process.env.VERSION : 'DEV'}
      </p>
      <h2>Open Source</h2>
      <p>
        At LINBIT we leverage on the advantages of working with Open Source components. We are standing and building on
        the shoulders of giants. With that it is our desire to contribute to this wonderful pool of open source
        components.
      </p>
      <p>
        While Open Source makes our jobs more enjoyable it does not feed us and our families by itself. The GUI that
        glues all the open source parts together (&quot;LINBIT VSAN&quot;) is a closed source component by LINBIT. In
        order to use the complete LINBIT VSAN you need to get a support and update subscription for it. You will be
        amazed by the value of our support services, which are delivered with the same passion with which we develop
        software.
      </p>
      <h2>Components</h2>
      <p>LINBIT develops and maintains these components of LINBIT VSAN:</p>
      <StyledUL>
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
      </StyledUL>
      <p>
        The source code of these components is available at{' '}
        <a target="_blank" href="https://github.com/LINBIT" rel="noreferrer">
          github.com/LINBIT
        </a>
        .
      </p>
      <p>
        LINBIT VSAN is based on the LINUX distribution{' '}
        <a target="_blank" href="https://almalinux.org/" rel="noreferrer">
          AlmaLinux
        </a>
        , and contains many packages that are provided by the AlmaLinux team.
      </p>
      <h2>Authors</h2>
      <p>These fellow LINBITers helped create this product:</p>
      <StyledUL>
        <li>Christoph Böhmwalder - DRBD, linstor-gateway, linstor-appliance, frontend, packaging, testing</li>
        <li>Rene Peinthor - LINSTOR, linstor-appliance</li>
        <li>Gábor Hernádi - LINSTOR mastermind</li>
        <li>Joel Colledge - fullstack LINSTOR &amp; DRBD</li>
        <li>Robert Altnöder - LINSTOR, linstor-gateway</li>
        <li>Johanna Kucera - linstor-appliance frontend</li>
        <li>Roland Kammerer - DRBD, packaging, building, developer infrastructure and more</li>
        <li>Lars Ellenberg - DRBD guru</li>
        <li>Philipp Reisner - DRBD and leading</li>
      </StyledUL>

      <Modal
        title="VSAN Host"
        open={hostModal}
        onOk={() => {
          handleSetHost();
        }}
        onCancel={() => setHostModal(false)}
      >
        <span>VSAN Host(for debug only)</span>:
        <br />
        <Input value={host} onChange={(evt) => setHost(evt.target.value)} placeholder="https://192.168.0.1:1443" />
      </Modal>
    </PageBasic>
  );
};
