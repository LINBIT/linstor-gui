import React from 'react';
import { useNavigate } from 'react-router-dom';
import SVG from 'react-inlinesvg';
import { isUrl } from '@app/utils/stringUtils';
import isSvg from 'is-svg';
import logo from '@app/assets/Linbit_Logo_White-1.png';

interface LogoImgProps {
  vsanModeFromSetting?: boolean;
  KVS?: any;
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

export const LogoImg: React.FC<LogoImgProps> = ({ vsanModeFromSetting, KVS, logoSrc }) => {
  const navigate = useNavigate();

  function handleClick() {
    navigate(vsanModeFromSetting && KVS?.vsanMode ? '/vsan/dashboard' : '/');
  }

  return (
    <div className="cursor-pointer">
      <img src={logo} className="logo" onClick={handleClick} alt="LINBIT Logo" />
      {'  '}
      <div className="customerlogo">{renderLogo(logoSrc)}</div>
    </div>
  );
};
