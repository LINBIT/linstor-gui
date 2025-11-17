// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import * as React from 'react';
import { Dropdown, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { DeploymentUnitOutlined, DownOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { Dispatch } from '@app/store';
import { ChangePassword } from '@app/features/authentication';
import { Mode } from '@app/hooks/useUIModeStorage';
import { DEFAULT_ADMIN_USER_NAME } from '@app/const/settings';
import { BRAND_COLOR } from '@app/const/color';
import { getControllerVersion } from '@app/features/node';
import { useFaultyResources } from '@app/features/resource/hooks/useFaultyResources';
import { createSvgColorStyle } from '@app/utils/colorUtils';

import LogSidebar from './LogSidebar';
import HeaderAboutModal from './HeaderAboutModal';
import ConnectStatus from './ConnectStatus';
import LngSelector from './LngSelector';
import PassphrasePrompt from './PassphrasePrompt';

import logout from '@app/assets/logout.svg';
import warning from '@app/assets/warning-icon.svg';
import outlink from '@app/assets/out-link.svg';

import { Attention, ImgIcon, NoSupport, OfficialBuild, OutLink, WarningLogo } from '../styled';
import { FaultyResourceIcon, UserIcon } from '@app/components/SVGIcon';

interface HeaderToolsProps {
  authInfo: {
    username: string;
  };
  vsanModeFromSetting?: boolean;
  isNotOfficialBuild?: boolean;
  VSANEvalMode?: boolean;
  hciModeFromSetting?: boolean;
  normalWithoutAuth?: boolean;
  authenticationEnabled?: boolean;
  VSANAvailable?: boolean;
  onModeChange: (mode: Mode) => void;
  handleSupportClick: () => void;
}

// This function compares two version strings and returns true if version1 is greater than or equal to version2.
const compareVersions = (version1: string | undefined, version2: string): boolean => {
  if (!version1) return false;

  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1 = v1Parts[i] || 0;
    const v2 = v2Parts[i] || 0;

    if (v1 > v2) return true;
    if (v1 < v2) return false;
  }

  return true; // Equal versions
};

const HeaderTools: React.FC<HeaderToolsProps> = ({
  authInfo,
  vsanModeFromSetting,
  isNotOfficialBuild,
  VSANEvalMode,
  normalWithoutAuth,
  authenticationEnabled,
  VSANAvailable,
  onModeChange,
  handleSupportClick,
  hciModeFromSetting,
}) => {
  const { t } = useTranslation(['menu', 'about']);
  const dispatch = useDispatch<Dispatch>();
  const IS_DEV = import.meta.env.MODE === 'development';

  const { data: faultyResources } = useFaultyResources();
  const hasFaultyResources = faultyResources && faultyResources.length > 0;

  const { data: linstorVersion, isFetched } = useQuery({
    queryKey: ['linstorVersion'],
    queryFn: () => getControllerVersion(),
  });

  const checkPassphraseAvailable = isFetched && compareVersions(linstorVersion?.data?.rest_api_version, '1.25.0');

  const menu = {
    items: [
      {
        key: 'userinfo',
        label: (
          <a
            rel="noopener noreferrer"
            href="#"
            onClick={(e) => {
              e.preventDefault();
            }}
            className="flex items-center"
          >
            <UserIcon
              style={createSvgColorStyle('brandOrange', {
                marginLeft: 2,
                marginRight: '1rem',
              })}
              width={16}
              height={16}
            />
            <span>
              {t('common:user')}: {authInfo.username || DEFAULT_ADMIN_USER_NAME}
            </span>
          </a>
        ),
        hidden: false,
      },
      {
        key: 'changepassword',
        label: <ChangePassword />,
        hidden: !authenticationEnabled,
      },
      {
        key: 'changemode',
        label: (
          <a
            rel="noopener noreferrer"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onModeChange(vsanModeFromSetting ? 'NORMAL' : 'VSAN');
            }}
            className="flex items-center"
          >
            <DeploymentUnitOutlined style={{ color: BRAND_COLOR, marginLeft: 2, marginRight: '1rem' }} />

            <span>{vsanModeFromSetting ? 'Switch to advanced mode' : 'Leave advanced mode'}</span>
          </a>
        ),
        hidden: !VSANAvailable,
      },
      {
        key: 'logout',
        label: (
          <a
            rel="noopener noreferrer"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              dispatch.auth.logout();
            }}
            className="flex items-center"
          >
            <ImgIcon src={logout} alt="logout" />
            <span>{t('common:logout')}</span>
          </a>
        ),
        hidden: !authenticationEnabled,
      },
    ],
  };

  return (
    <div className="flex w-full items-center justify-end">
      <div>
        {isNotOfficialBuild && (
          <div className="hidden xl:flex flex-col xl:flex-row text-white items-center font-semibold gap-2 xl:gap-0">
            <div className="flex items-center">
              <WarningLogo src={warning} />
              <Attention>{t('about:unofficial_build_header_attention')}</Attention>
            </div>
            <OfficialBuild onClick={handleSupportClick}>
              {t('about:unofficial_build_header_get_official')}{' '}
              <OutLink src={outlink} className="outlink-svg brightness-0" />
            </OfficialBuild>
          </div>
        )}
        {vsanModeFromSetting && VSANEvalMode && (
          <NoSupport>
            <WarningLogo src={warning} />
            <Attention>
              Your eval contract has expired. Please{' '}
              <a
                href={
                  IS_DEV
                    ? import.meta.env.VITE_HCI_VSAN_API_HOST + '/register.html'
                    : 'https://' + window.location.hostname + '/register.html'
                }
                target="_blank"
                rel="noreferrer"
              >
                re-register
              </a>{' '}
              with a new contract. Until then all iSCSI targets will be stopped.
            </Attention>
          </NoSupport>
        )}
      </div>

      <div className="flex items-center ml-4 sm:ml-0 lg:ml-20">
        <div className="flex items-center" style={{ gap: '24px' }}>
          <div className="flex items-center">
            {hasFaultyResources && (
              <Tooltip title={t('settings:has_faulty_resources', 'Has faulty resources')}>
                <div>
                  <FaultyResourceIcon />
                </div>
              </Tooltip>
            )}
          </div>
          <div>
            <ConnectStatus />
          </div>
          <div>{checkPassphraseAvailable && <PassphrasePrompt />}</div>
          <div>{!vsanModeFromSetting && <LogSidebar />}</div>
        </div>

        <div className="flex items-center" style={{ gap: '24px', marginLeft: '84px' }}>
          {!vsanModeFromSetting && <LngSelector />}
          {!normalWithoutAuth && !hciModeFromSetting && (
            <Dropdown menu={menu} placement="bottomLeft" trigger={['hover']}>
              <div className="flex items-center cursor-pointer text-white">
                <UserIcon className="text-white w-6 h-6" />
                <DownOutlined className="ml-1 text-white" />
              </div>
            </Dropdown>
          )}

          {!vsanModeFromSetting && <HeaderAboutModal linstorVersion={linstorVersion?.data} />}
        </div>
      </div>
    </div>
  );
};

export default HeaderTools;
