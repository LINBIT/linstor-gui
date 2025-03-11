// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import * as React from 'react';
import { Avatar, Dropdown } from 'antd';
import { useTranslation } from 'react-i18next';
import { DeploymentUnitOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { Dispatch } from '@app/store';
import { ChangePassword } from '@app/features/authentication';
import { Mode } from '@app/hooks/useUIModeStorage';
import { BRAND_COLOR } from '@app/const/color';

import LogSidebar from './LogSidebar';
import HeaderAboutModal from './HeaderAboutModal';
import ConnectStatus from './ConnectStatus';
import LngSelector from './LngSelector';

import logout from '@app/assets/logout.svg';
import user from '@app/assets/user.svg';
import warning from '@app/assets/warning-icon.svg';
import outlink from '@app/assets/out-link.svg';

import { Attention, ImgIcon, NoSupport, OfficialBuild, OutLink, WarningLogo } from '../styled';

interface HeaderToolsProps {
  authInfo: any;
  vsanModeFromSetting?: boolean;
  isNotOfficialBuild?: boolean;
  VSANEvalMode?: boolean;
  UIMode: string;
  normalWithoutAuth?: boolean;
  authenticationEnabled?: boolean;
  VSANAvailable?: boolean;
  onModeChange: (mode: Mode) => void;
  handleSupportClick: () => void;
}

const HeaderTools: React.FC<HeaderToolsProps> = ({
  authInfo,
  vsanModeFromSetting,
  isNotOfficialBuild,
  VSANEvalMode,
  UIMode,
  normalWithoutAuth,
  authenticationEnabled,
  VSANAvailable,
  onModeChange,
  handleSupportClick,
}) => {
  const { t } = useTranslation(['menu']);
  const dispatch = useDispatch<Dispatch>();
  const IS_DEV = process.env.NODE_ENV === 'development';

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
            <ImgIcon src={user} alt="user" />
            <span>
              {t('common:user')}: {authInfo.username || 'admin'}
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
              onModeChange(UIMode === 'VSAN' ? 'NORMAL' : 'VSAN');
            }}
            className="flex items-center"
          >
            <DeploymentUnitOutlined style={{ color: BRAND_COLOR, marginLeft: 2, marginRight: '1rem' }} />

            <span>{UIMode === 'VSAN' ? 'Switch to advanced mode' : 'Leave advanced mode'}</span>
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
      {isNotOfficialBuild && (
        <div className="hidden lg:flex text-white items-center font-semibold mr-4">
          <WarningLogo src={warning} />
          <Attention>Attention! You are using an unsupported build.</Attention>
          <OfficialBuild onClick={handleSupportClick}>
            For Official Builds <OutLink src={outlink} className="outlink-svg" />
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
                  ? import.meta.env.VITE_VSAN_API_HOST + '/register.html'
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
      <ConnectStatus />

      <div className="flex items-center">
        {!vsanModeFromSetting && (
          <>
            <HeaderAboutModal />
            <LngSelector />
            <LogSidebar />
          </>
        )}

        {!normalWithoutAuth && (
          <Dropdown menu={menu} placement="bottomLeft">
            <Avatar
              size={40}
              style={{ backgroundColor: '#f7a75c', color: '#1e2939', cursor: 'pointer', marginLeft: 20 }}
            >
              {authInfo.username?.charAt(0).toUpperCase() || 'A'}
            </Avatar>
          </Dropdown>
        )}
      </div>
    </div>
  );
};

export default HeaderTools;
