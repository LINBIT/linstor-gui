// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { Layout, message } from 'antd';
import SVG from 'react-inlinesvg';
import { useTranslation } from 'react-i18next';

import { Dispatch, RootState } from '@app/store';
import { ChangePassword, Login } from '@app/features/authentication';
import { useUIModeStorage } from '@app/hooks';
import { Mode } from '@app/hooks/useUIModeStorage';
import { useNav } from '../NavContext';
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
  registered?: boolean;
  isFetched?: boolean;
}

const handleSupportClick = () => {
  window.open('https://linbit.com/sds-subscription/', '_blank');
};

const AppLayout = ({ children, registered, isFetched }: IAppLayout) => {
  const { UIMode, updateUIMode } = useUIModeStorage();
  const dispatch = useDispatch<Dispatch>();
  const history = useHistory();
  const { t } = useTranslation(['menu']);

  const [isModalOpen, setIsModalOpen] = useState(false);

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
    dispatch.setting.setVSANMode(mode === 'VSAN');
    history.push(mode === 'VSAN' ? '/vsan/dashboard' : '/');
  };

  useEffect(() => {
    dispatch.auth.checkLoginStatus();
  }, [dispatch.auth]);

  const { KVS, authInfo, logoSrc, vsanModeFromSetting, isAdmin, gatewayAvailable, VSANEvalMode } = useSelector(
    (state: RootState) => ({
      KVS: state.setting.KVS,
      authInfo: state.auth,
      logoSrc: state.setting.logo,
      vsanModeFromSetting: state.setting.vsanMode,
      isAdmin: state.setting.isAdmin,
      gatewayAvailable: state.setting.gatewayAvailable,
      VSANEvalMode: state.setting.evalMode,
    }),
  );

  // if authenticationEnabled is false then just enter the page
  const authenticationEnabled = KVS?.authenticationEnabled;

  useEffect(() => {
    const VSAN_URL = history.location.pathname.includes('/vsan');
    const initialOpenFromVSAN =
      history.location.pathname === '/vsan/dashboard' && history.location.search === '?vsan=true';

    if (initialOpenFromVSAN) {
      dispatch.setting.initSettingStore(VSAN_URL);
    } else {
      dispatch.setting.initSettingStore(false);
    }

    if (VSAN_URL) {
      dispatch.setting.setVSANMode(true);
      dispatch.setting.getMyLinbitStatus();
    }
  }, [dispatch.setting, history.location.pathname, history.location.search]);

  useEffect(() => {
    dispatch.setting.getSettings();
    dispatch.setting.getGatewayStatus();

    message.config({
      maxCount: 3,
    });
  }, [dispatch.setting]);

  const VSANAvailable = KVS?.vsanMode;
  const normalWithoutAuth = !VSANAvailable && !authenticationEnabled;
  const isNotOfficialBuild = isFetched && !registered && !vsanModeFromSetting;

  useEffect(() => {
    if (typeof isNotOfficialBuild !== 'undefined' && isNotOfficialBuild) {
      setIsModalOpen(true);
    }
  }, [isNotOfficialBuild]);

  if (authenticationEnabled && !authInfo.isLoggedIn) {
    return (
      <>
        <Login />
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          limit={3}
        />
      </>
    );
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
          <LogoImg vsanModeFromSetting={vsanModeFromSetting} KVS={KVS} logoSrc={logoSrc} />
          <HeaderTools
            authInfo={authInfo}
            vsanModeFromSetting={vsanModeFromSetting}
            isNotOfficialBuild={isNotOfficialBuild}
            VSANEvalMode={VSANEvalMode}
            UIMode={UIMode}
            normalWithoutAuth={normalWithoutAuth}
            authenticationEnabled={authenticationEnabled}
            VSANAvailable={VSANAvailable}
            onModeChange={onModeChange}
            handleSupportClick={handleSupportClick}
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
              KVS={KVS}
              gatewayAvailable={gatewayAvailable}
              authenticationEnabled={authenticationEnabled}
              isAdmin={isAdmin}
            />
          </Sider>
          <Content className="p-[24px] m-[12px] bg-white rounded-xl">{children}</Content>
        </Layout>
      </Layout>

      <ToastContainer
        position="top-right"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={3}
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
            <div>Attention! You are using an unsupported build of this software. </div>
            <div>By acquiring an official version through a support subscription from LINBIT:</div>

            <SupportList>
              <SupportListItem>You get access to the LINBIT expert support team.</SupportListItem>
              <SupportListItem>You get access to prebuilt packages for the whole LINBIT SDS stack.</SupportListItem>
              <SupportListItem>You support the continued development of the LINBIT SDS stack.</SupportListItem>
            </SupportList>

            <ForOfficialBuild onClick={handleSupportClick}>
              For Official Builds <SVG src={arrowRight} className="outlink-svg" />
            </ForOfficialBuild>
          </StyledContent>
        </ModalContent>
      </StyledModal>
    </>
  );
};

export default AppLayout;
