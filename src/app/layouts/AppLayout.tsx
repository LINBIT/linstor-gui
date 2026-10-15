// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, message, FloatButton, Grid, Modal } from 'antd';
import { VerticalAlignTopOutlined } from '@ant-design/icons';
import { IoMenuOutline } from 'react-icons/io5';
import SVG from 'react-inlinesvg';
import { useTranslation } from 'react-i18next';

import { ChangePassword } from '@app/features/authentication/components/ChangePassword/ChangePassword';
import { Login } from '@app/features/authentication/pages/Login';
import { useUIModeStorage } from '@app/hooks';
import { Mode } from '@app/hooks/useUIModeStorage';
import { UIMode as SettingUIMode } from '@app/features/settings/types'; // import SettingUIMode enum
import { useSettings } from '@app/features/settings/useSettings';
import { useAuth } from '@app/features/authentication/useAuth';
import { useNav } from '@app/hooks';
import Navigation from './components/Navigation';
import HeaderTools from './components/HeaderTools';
import ThemeToggle from './components/ThemeToggle';
import { LogoImg } from './components/LogoImg';
import warning from '@app/assets/warning-icon.svg';
import arrowRight from '@app/assets/arrow_right.svg';
import './AppLayout.css';
import { Button } from '@app/components/Button';

const { Header, Content, Sider } = Layout;

// Shell metrics tuned against the Figma prototype (the handoff's ≈82px/≈337px
// were measured at a different zoom and render visibly oversized at 1:1).
const HEADER_HEIGHT = 72;
const SIDEBAR_WIDTH = 276;

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
  const {
    KVS,
    logo: logoSrc,
    mode: modeFromSetting,
    isAdmin,
    gatewayAvailable,
    evalMode: VSANEvalMode,
    grafanaConfig,
    setMode,
    initSettingStore,
    getMyLinbitStatus,
  } = useSettings();
  const authInfo = useAuth();
  const { checkLoginStatus } = authInfo;
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);

  const { isNavOpen, toggleNav, setNavOpen } = useNav();
  // Below md the collapsed sidebar hides entirely (0px) instead of icons-only
  const screens = Grid.useBreakpoint();

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
    setMode(mode as SettingUIMode);
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
    checkLoginStatus();
  }, [checkLoginStatus]);

  const vsanModeFromSetting = modeFromSetting === SettingUIMode.VSAN;
  const hciModeFromSetting = modeFromSetting === SettingUIMode.HCI;

  // if authenticationEnabled is false then just enter the page
  const authenticationEnabled = KVS?.authenticationEnabled;

  useEffect(() => {
    // initialize store and UI mode based on URL prefix
    if (location.pathname.startsWith('/vsan')) {
      initSettingStore(SettingUIMode.VSAN);
      setMode(SettingUIMode.VSAN);
      getMyLinbitStatus();
      updateUIMode('VSAN');
    } else if (location.pathname.startsWith('/hci')) {
      initSettingStore(SettingUIMode.HCI);
      setMode(SettingUIMode.HCI);
      getMyLinbitStatus();
      updateUIMode('HCI');
    } else {
      initSettingStore(SettingUIMode.NORMAL);
      setMode(SettingUIMode.NORMAL);
      updateUIMode('NORMAL');
    }
    // remove any query parameters
    if (location.search) {
      navigate(location.pathname, { replace: true });
    }
    // On navigation to another page only. The lists write their filters into
    // the current page's query string, which a search dependency would strip
    // again at once; updateUIMode is a new function on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // The settings load themselves when the SettingsProvider mounts.
  useEffect(() => {
    message.config({
      maxCount: 3,
    });
  }, []);

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
    // Store the current location for redirect after login
    const redirectTo = location.pathname !== '/login' ? location.pathname + location.search : '/';
    return <Login redirectTo={redirectTo} />;
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
            height: HEADER_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            // Light-gray top bar matching the sidebar (per the Figma prototype;
            // NOTE: the tokens JSON says bg/nav=#111 for the top bar, but the
            // light-mode prototype clearly renders it as bg/surface — follow
            // the visual until design confirms).
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            // Inherited by the currentColor header icons (log, dots, user, …)
            color: 'var(--icon-default)',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <Button
            type="text"
            icon={<IoMenuOutline />}
            onClick={toggleNav}
            aria-label={t('common:toggle_navigation')}
            style={{
              fontSize: '20px',
              width: screens.md ? 64 : 40,
              height: screens.md ? 64 : 40,
              color: 'var(--icon-default)',
              marginRight: screens.md ? '16px' : '8px',
            }}
          />
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
            collapsed={isNavOpen}
            width={SIDEBAR_WIDTH}
            breakpoint="lg"
            // Auto-collapse below ~992px, re-expand above (isNavOpen === collapsed)
            onBreakpoint={setNavOpen}
            collapsedWidth={screens.md === false ? 0 : 80}
            style={{
              position: 'sticky',
              top: HEADER_HEIGHT,
              height: `calc(100vh - ${HEADER_HEIGHT}px)`,
              overflowY: 'auto',
              backgroundColor: 'var(--bg-surface)',
              borderTopRightRadius: '4px',
            }}
          >
            <div className="flex min-h-full flex-col">
              <div className="flex-1">
                <Navigation
                  isNavOpen={isNavOpen}
                  vsanModeFromSetting={vsanModeFromSetting}
                  hciModeFromSetting={hciModeFromSetting}
                  KVS={KVS}
                  grafanaConfig={grafanaConfig}
                  gatewayAvailable={gatewayAvailable}
                  authenticationEnabled={authenticationEnabled}
                  isAdmin={isAdmin}
                />
              </div>
              {/* Theme toggle pinned near the bottom of the sidebar (handoff §6) */}
              <div className="p-4">
                <ThemeToggle collapsed={isNavOpen} />
              </div>
            </div>
          </Sider>
          <Content className="p-4 md:p-[24px] bg-[var(--bg-page)]">{children}</Content>
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

      {authenticationEnabled && authInfo.isAdmin && authInfo.isLoggedIn && authInfo.needsPasswordChange && (
        <ChangePassword defaultOpen={authInfo.needsPasswordChange} admin={false} />
      )}

      <Modal
        styles={{
          container: { borderRadius: 16 },
          header: { borderRadius: '16px 16px 0 0' },
          footer: { borderRadius: '0 0 16px 16px' },
          body: { padding: '6px 0' },
        }}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        mask={{ closable: false }}
        footer={null}
        centered
        width={755}
        height={200}
      >
        <div className="flex">
          <SVG className="mt-2.5 mr-[18px] h-[56px] w-[60px]" src={warning} />
          <div className="pt-4 pb-0 text-[16px]">
            <div className="text-[16px] font-semibold">
              <div>{t('about:unofficial_build_attention')}</div>
              <div>{t('about:unofficial_build_description')}</div>
            </div>

            <ul className="mt-2 list-[square] pl-[30px] font-normal">
              <li className="mb-2 pl-2 indent-[-6px] text-[16px]">{t('about:unofficial_build_benefit_support')}</li>
              <li className="mb-2 pl-2 indent-[-6px] text-[16px]">{t('about:unofficial_build_benefit_packages')}</li>
              <li className="mb-2 pl-2 indent-[-6px] text-[16px]">{t('about:unofficial_build_benefit_development')}</li>
            </ul>

            <div
              className="flex max-w-[190px] cursor-pointer items-center justify-center rounded border-2 border-(--brand-accent) px-3 py-2 font-bold hover:text-(--brand-accent) [&:hover_.outlink-svg_path]:fill-(--brand-accent) [&_.outlink-svg]:ml-1.5"
              onClick={handleSupportClick}
            >
              {t('about:unofficial_build_get_official')} <SVG src={arrowRight} className="outlink-svg" />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AppLayout;
