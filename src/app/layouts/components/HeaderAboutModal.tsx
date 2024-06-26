import React, { useMemo, useState } from 'react';
import { AboutModal, Button, TextContent, TextList, TextListItem } from '@patternfly/react-core';
import bgImg from '@app/assets/about_image.png';
import brandImg from '@app/bgimages/Linbit_Logo_White-1.png';

import FEATHER_INFO from '@app/assets/feather-info.svg';

import { useQuery } from '@tanstack/react-query';
import { useRequest } from 'ahooks';
import { fetchMetrics } from '@app/requests/dashboard';
import get from 'lodash.get';
import parsePrometheusTextFormat from 'parse-prometheus-text-format';

import PropertyForm from '@app/components/PropertyForm';
import service from '@app/requests';
import { InfoIcon } from './styled';

const HeaderAboutModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);

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
        trademark="Subscribers to LINBIT's LINBIT-SDS subscriptions get a permanent license to use this GUI software. Re-distribution not allowed."
        brandImageSrc={brandImg}
        brandImageAlt="Patternfly Logo"
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
