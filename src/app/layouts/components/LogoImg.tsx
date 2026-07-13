import React from 'react';
import { useNavigate } from 'react-router-dom';
import SVG from 'react-inlinesvg';
import { isUrl } from '@app/utils/stringUtils';
import isSvg from 'is-svg';
import logoOnDark from '@app/assets/brand-dark.svg';
import logoOnLight from '@app/assets/brand-light.svg';
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
    return <img src={logoSrc} alt="logo" className="max-h-14 max-w-40 object-contain" />;
  }
  if (isSvg(logoSrc)) {
    return <SVG src={logoSrc || ''} className="max-h-14 max-w-40" />;
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
    <div className="cursor-pointer flex items-center">
      {/* Theme-aware brand mark: dark lettering on the light header, white on dark (app.css swaps visibility). */}
      <img src={logoOnLight} className="w-28 md:w-40 logo-on-light" onClick={handleClick} alt="LINBIT logo" />
      <img src={logoOnDark} className="w-28 md:w-40 logo-on-dark" onClick={handleClick} alt="LINBIT logo" />
      {logoSrc && (
        <>
          {' '}
          <div className="mx-2 text-2xl" style={{ color: 'var(--text-primary)' }}>
            {'|'}
          </div>
          <div className="">{renderLogo(logoSrc)}</div>
        </>
      )}
    </div>
  );
};
