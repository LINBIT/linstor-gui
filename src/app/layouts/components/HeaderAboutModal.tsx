// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useMemo, useState } from 'react';
import { AboutModal, Button, TextContent, TextList, TextListItem } from '@patternfly/react-core';
import bgImg from '@app/assets/about_image.png';
import brandImg from '@app/bgimages/Linbit_Logo_White-1.png';

import FEATHER_INFO from '@app/assets/feather-info.svg';

import { useQuery } from '@tanstack/react-query';
import { fetchMetrics } from '@app/requests/dashboard';
import get from 'lodash.get';
import parsePrometheusTextFormat from 'parse-prometheus-text-format';

import { InfoIcon } from './styled';

const HeaderAboutModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: metrics } = useQuery({
    queryKey: ['getMetics'],
    queryFn: fetchMetrics,
  });

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const hostName = window ? window.location.host : '';

  const linstorVersion = useMemo(() => {
    let data: any = [];
    try {
      data = metrics && parsePrometheusTextFormat(metrics || []);
      const linstorInfo = data?.find((e) => e.name === 'linstor_info');
      return get(linstorInfo, 'metrics[0].labels.version', 'unknown');
    } catch (error) {
      console.log(error, 'error');
    }

    return data;
  }, [metrics]);

  return (
    <div>
      <InfoIcon title="LINSTOR GUI Info" src={FEATHER_INFO} onClick={handleModalToggle} />

      <AboutModal
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        trademark="LINSTOR-GUI is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3 of the License. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details."
        brandImageSrc={brandImg}
        brandImageAlt="Logo"
        productName="LINBIT-SDS"
        backgroundImageSrc={bgImg}
      >
        <TextContent>
          <TextList component="dl">
            <TextListItem component="dt">LINSTOR Version</TextListItem>
            <TextListItem component="dd">{linstorVersion}</TextListItem>
            <TextListItem component="dt">UI Version</TextListItem>
            <TextListItem component="dd">{process.env.VERSION}</TextListItem>
            <TextListItem component="dt">Controller Binding IP</TextListItem>
            <TextListItem component="dd">0.0.0.0</TextListItem>
            <TextListItem component="dt">Controller Active On</TextListItem>
            <TextListItem component="dd">{hostName}</TextListItem>
          </TextList>
        </TextContent>
      </AboutModal>
    </div>
  );
};

export default HeaderAboutModal;
