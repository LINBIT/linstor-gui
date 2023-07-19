import React from 'react';
import SVG from 'react-inlinesvg';
import styled from '@emotion/styled';
import { useSelector } from 'react-redux';
import isSvg from 'is-svg';

import { RootState } from '@app/store';
import SVGFileUpload from './SVGUploader';

const Wrapper = styled.div`
  display: flex;
  padding: 2em 0;
`;

const Label = styled.span`
  margin-right: 1em;
  margin-top: 3rem;
`;

const LogoWrapper = styled.div``;

// For setting Logo related stuff
const Logo: React.FC = () => {
  const { logoSrc } = useSelector((state: RootState) => ({
    logoSrc: state.setting.logo,
  }));
  return (
    <Wrapper>
      <Label>Customize Logo</Label>
      <LogoWrapper>
        {isSvg(String(logoSrc)) ? <SVG src={logoSrc as any} width="240" height="120" /> : null}
        <SVGFileUpload />
      </LogoWrapper>
    </Wrapper>
  );
};

export default Logo;
