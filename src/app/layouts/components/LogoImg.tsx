import React from 'react';
import { useNavigate } from 'react-router-dom';
import SVG from 'react-inlinesvg';
import { isUrl } from '@app/utils/stringUtils';
import isSvg from 'is-svg';
import logo from '@app/assets/brand-dark.svg';
import { UIMode } from '@app/models/setting';
import { RootState } from '@app/store';
import { useSelector } from 'react-redux';

interface LogoImgProps {
  logoSrc?: string;
}

const renderLogo = (logoSrc?: string) => {
  if (!logoSrc) {
    return null;
  }
  if (isUrl(logoSrc) && !isSvg(logoSrc)) {
    return <img src={logoSrc} alt="logo" width={40} height={40} />;
  }
  if (isSvg(logoSrc)) {
    return <SVG src={logoSrc || ''} width="40" height="40" />;
  }
  return null;
};

export const LogoImg: React.FC<LogoImgProps> = ({ logoSrc }) => {
  const { mode } = useSelector((state: RootState) => ({
    mode: state.setting.mode,
  }));

  const navigate = useNavigate();

  const handleClick = () => {
    if (mode === UIMode.HCI) {
      navigate('/hci/dashboard');
    } else if (mode === UIMode.VSAN) {
      navigate('/vsan/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="cursor-pointer">
      <img src={logo} className="w-40" onClick={handleClick} alt="LINBIT logo" />
      {'  '}
      <div className="customerlogo">{renderLogo(logoSrc)}</div>
    </div>
  );
};
