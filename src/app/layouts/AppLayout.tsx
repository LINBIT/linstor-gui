// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layout, message, FloatButton } from 'antd';
import { VerticalAlignTopOutlined } from '@ant-design/icons';
import SVG from 'react-inlinesvg';
import { useTranslation } from 'react-i18next';

import { Dispatch, RootState } from '@app/store';
import { ChangePassword, Login } from '@app/features/authentication';
import { useUIModeStorage } from '@app/hooks';
import { Mode } from '@app/hooks/useUIModeStorage';
import { UIMode as SettingUIMode } from '@app/models/setting'; // import SettingUIMode enum
import { useNav } from '@app/hooks';
import Navigation from './components/Navigation';
import HeaderTools from './components/HeaderTools';
import { LogoImg } from './components/LogoImg';
import warning from '@app/assets/warning-icon.svg';
import arrowRight from '@app/assets/arrow_right.svg';
import {
  ForOfficialBuild,
  ModalContent,
  StyledContent,
  StyledModal,
  SupportList,
  SupportListItem,
  Warning,
} from './styled';
import './AppLayout.css';

const { Header, Content, Sider } = Layout;

interface IAppLayout {
  children: React.ReactNode;
  isSpaceTrackingUnavailable?: boolean;
  isCheckingStatus?: boolean;
}

const handleSupportClick = () => {
  window.open('https://linbit.com/sds-subscription/', '_blank');
};

const AppLayout = ({ children, isSpaceTrackingUnavailable, isCheckingStatus }: IAppLayout) => {
  const { t } = useTranslation(['about']);
  const { updateUIMode } = useUIModeStorage();
  const dispatch = useDispatch<Dispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);

  const { isNavOpen, toggleNav } = useNav();

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onModeChange = (mode: Mode) => {
    toggleNav();
    updateUIMode(mode);
    // update UI mode in store using SettingUIMode enum
    dispatch.setting.setMode(mode as SettingUIMode);
    // navigate to the selected mode dashboard
    if (mode === 'VSAN') {
      navigate('/vsan/dashboard');
    } else if (mode === 'HCI') {
      navigate('/hci/dashboard');
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    dispatch.auth.checkLoginStatus();
  }, [dispatch.auth]);

  const { KVS, authInfo, logoSrc, modeFromSetting, isAdmin, gatewayAvailable, VSANEvalMode } = useSelector(
    (state: RootState) => ({
      KVS: state.setting.KVS,
      authInfo: state.auth,
      logoSrc: state.setting.logo,
      modeFromSetting: state.setting.mode,
      isAdmin: state.setting.isAdmin,
      gatewayAvailable: state.setting.gatewayAvailable,
      VSANEvalMode: state.setting.evalMode,
    }),
  );

  const vsanModeFromSetting = modeFromSetting === SettingUIMode.VSAN;
  const hciModeFromSetting = modeFromSetting === SettingUIMode.HCI;

  // if authenticationEnabled is false then just enter the page
  const authenticationEnabled = KVS?.authenticationEnabled;

  useEffect(() => {
    // initialize store and UI mode based on URL prefix
    if (location.pathname.startsWith('/vsan')) {
      dispatch.setting.initSettingStore(SettingUIMode.VSAN);
      dispatch.setting.setMode(SettingUIMode.VSAN);
      dispatch.setting.getMyLinbitStatus();
      updateUIMode('VSAN');
    } else if (location.pathname.startsWith('/hci')) {
      dispatch.setting.initSettingStore(SettingUIMode.HCI);
      dispatch.setting.setMode(SettingUIMode.HCI);
      dispatch.setting.getMyLinbitStatus();
      updateUIMode('HCI');
    } else {
      dispatch.setting.initSettingStore(SettingUIMode.NORMAL);
      dispatch.setting.setMode(SettingUIMode.NORMAL);
      updateUIMode('NORMAL');
    }
    // remove any query parameters
    if (location.search) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname]);

  useEffect(() => {
    dispatch.setting.getSettings();
    dispatch.setting.getGatewayStatus();

    message.config({
      maxCount: 3,
    });
  }, [dispatch.setting]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const VSANAvailable = KVS?.vsanAvailable;
  const normalWithoutAuth = !VSANAvailable && !authenticationEnabled;
  const isNotOfficialBuild = !isCheckingStatus && isSpaceTrackingUnavailable;

  useEffect(() => {
    if (isNotOfficialBuild) {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [isNotOfficialBuild, isCheckingStatus]);

  if (authenticationEnabled && !authInfo.isLoggedIn) {
    return <Login />;
  }

  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 60,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#1e2939',
          }}
        >
          <LogoImg logoSrc={logoSrc} />
          <HeaderTools
            authInfo={authInfo}
            vsanModeFromSetting={vsanModeFromSetting}
            isNotOfficialBuild={isNotOfficialBuild}
            VSANEvalMode={VSANEvalMode}
            normalWithoutAuth={normalWithoutAuth}
            authenticationEnabled={authenticationEnabled}
            VSANAvailable={VSANAvailable}
            onModeChange={onModeChange}
            handleSupportClick={handleSupportClick}
            hciModeFromSetting={hciModeFromSetting}
          />
        </Header>
        <Layout>
          <Sider
            collapsible
            collapsed={isNavOpen}
            onCollapse={toggleNav}
            width="240"
            style={{ height: 'calc(100vh-64px)', overflowY: 'auto', backgroundColor: '#1e2939' }}
          >
            <Navigation
              isNavOpen={isNavOpen}
              vsanModeFromSetting={vsanModeFromSetting}
              hciModeFromSetting={hciModeFromSetting}
              KVS={KVS}
              gatewayAvailable={gatewayAvailable}
              authenticationEnabled={authenticationEnabled}
              isAdmin={isAdmin}
            />
          </Sider>
          <Content className="p-[24px] m-[12px] bg-white rounded-xl">{children}</Content>
        </Layout>
      </Layout>

      <FloatButton
        type="primary"
        icon={<VerticalAlignTopOutlined />}
        style={{
          display: showBackTop ? 'block' : 'none',
          right: '40px',
          bottom: '40px',
        }}
        tooltip="back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {authenticationEnabled && authInfo.isAdmin && authInfo.isLoggedIn && (
        <ChangePassword defaultOpen={authInfo.needsPasswordChange} admin={authInfo.isAdmin} />
      )}

      <StyledModal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        maskClosable={false}
        footer={null}
        centered
        width={1000}
      >
        <ModalContent>
          <Warning src={warning} />
          <StyledContent>
            <div>{t('about:unofficial_build_attention')}</div>
            <div>{t('about:unofficial_build_description')}</div>

            <SupportList>
              <SupportListItem>{t('about:unofficial_build_benefit_support')}</SupportListItem>
              <SupportListItem>{t('about:unofficial_build_benefit_packages')}</SupportListItem>
              <SupportListItem>{t('about:unofficial_build_benefit_development')}</SupportListItem>
            </SupportList>

            <ForOfficialBuild onClick={handleSupportClick}>
              {t('about:unofficial_build_get_official')} <SVG src={arrowRight} className="outlink-svg" />
            </ForOfficialBuild>
          </StyledContent>
        </ModalContent>
      </StyledModal>
    </>
  );
};

export default AppLayout;
