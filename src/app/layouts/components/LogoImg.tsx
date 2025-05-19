import React from 'react';
import { useNavigate } from 'react-router-dom';
import SVG from 'react-inlinesvg';
import { isUrl } from '@app/utils/stringUtils';
import isSvg from 'is-svg';
import logo from '@app/assets/Linbit_Logo_White-1.png';
import { UIMode } from '@app/models/setting';

interface LogoImgProps {
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

export const LogoImg: React.FC<LogoImgProps> = ({ KVS, logoSrc }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (KVS?.mode === UIMode.HCI) {
      navigate('/hci/dashboard');
    } else if (KVS?.mode === UIMode.VSAN) {
      navigate('/vsan/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="cursor-pointer">
      <img src={logo} className="logo" onClick={handleClick} alt="LINBIT Logo" />
      {'  '}
      <div className="customerlogo">{renderLogo(logoSrc)}</div>
    </div>
  );
};
