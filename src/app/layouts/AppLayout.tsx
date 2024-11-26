// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import * as React from 'react';
import { Link, useLocation, useHistory } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch, RootState } from '@app/store';
import {
  Page,
  PageHeader,
  PageSidebar,
  SkipToContent,
  PageHeaderTools,
  PageHeaderToolsGroup,
  PageHeaderToolsItem,
} from '@patternfly/react-core';

import { Avatar, Dropdown, Menu, MenuProps, message, Modal } from 'antd';

import SVG from 'react-inlinesvg';

import { routes } from '@app/routes/routes';

import HeaderAboutModal from './components/HeaderAboutModal';
import ConnectStatus from './components/ConnectStatus';
import LngSelector from './components/LngSelector';

import logo from '@app/bgimages/Linbit_Logo_White-1.png';
import logout from '@app/assets/logout.svg';
import user from '@app/assets/user.svg';
import warning from '@app/assets/warning-icon.svg';
import outlink from '@app/assets/out-link.svg';
import arrowRight from '@app/assets/arrow_right.svg';

import './AppLayout.css';
import isSvg from 'is-svg';
import { ChangePassword, Login } from '@app/features/authentication';
import { ImgIcon, SideMenu } from './styled';
import { useUIModeStorage, usePersistentMenuState } from '@app/hooks';
import { useEffect, useState } from 'react';
import {
  AppstoreOutlined,
  CloudServerOutlined,
  ContainerOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  DesktopOutlined,
  FileProtectOutlined,
  InfoCircleOutlined,
  MailOutlined,
  NodeIndexOutlined,
  PieChartOutlined,
  SettingOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { BRAND_COLOR } from '@app/const/color';
import { Mode } from '@app/hooks/useUIModeStorage';
import styled from '@emotion/styled';
import LogSidebar from './components/LogSidebar';
import { isUrl } from '@app/utils/stringUtils';
import { useTranslation } from 'react-i18next';

interface IAppLayout {
  children: React.ReactNode;
  registered?: boolean;
}

const NoSupport = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  margin-right: 60px;
  font-weight: 600;
`;

const WarningLogo = styled.img`
  width: 29px;
  height: 28px;
`;

const Attention = styled.div`
  color: #fff;
  margin-left: 16px;
  margin-right: 16px;
`;
const OutLink = styled(SVG)`
  width: 24px;
  height: 24px;
  margin-top: 1px;
  margin-left: 4px;
`;

const OfficialBuild = styled.div`
  font-weight: 500;
  padding-bottom: 2px;
  margin-top: 4px;
  border-bottom: 2px solid #f79133;
  cursor: pointer;
  display: flex;

  &:hover {
    color: #f79133;
  }

  &:hover .outlink-svg path {
    fill: #f79133;
    transform: scale(1.1);
  }
`;

const SupportList = styled.ul`
  margin-top: 8px;
  padding-left: 40px;
  font-weight: normal;
  list-style-type: square;
`;

const SupportListItem = styled.li`
  margin-bottom: 8px;
  padding-left: 12px;
  text-indent: -6px;
`;

const Warning = styled(SVG)`
  width: 80px;
  height: 76px;
  margin-right: 24px;
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
  }
  .ant-modal-header {
    border-radius: 16px 16px 0 0;
  }
  .ant-modal-footer {
    border-radius: 0 0 16px 16px;
  }
  .ant-modal-body {
    padding: 24px 0;
  }
`;

const ModalContent = styled.div`
  display: flex;
`;

const Content = styled.div`
  font-weight: 500;
  font-size: 24px;
  padding-top: 16px;
  padding-bottom: 0;
`;

const ForOfficialBuild = styled.div`
  font-weight: 500;
  display: flex;
  width: 280px;
  padding: 4px 8px;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: 2px solid #f79133;
  border-radius: 4px;

  &:hover {
    color: #f79133;
  }

  &:hover .outlink-svg path {
    fill: #f79133;
  }

  & .outlink-svg {
    margin-left: 6px;
  }
`;

const handleSupportClick = () => {
  window.open('https://linbit.com/sds-subscription/', '_blank');
};

const hideRoutes = (label, routes) => {
  return routes.filter((route) => {
    if (route.routes) {
      return hideRoutes(label, route.routes);
    }
    return route.label !== label;
  });
};

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const AppLayout: React.FunctionComponent<IAppLayout> = ({ children, registered }) => {
  const [isNavOpen, setIsNavOpen] = usePersistentMenuState(true);
  const [isMobileView, setIsMobileView] = useState(true);
  const [isNavOpenMobile, setIsNavOpenMobile] = useState(false);
  const { UIMode, updateUIMode } = useUIModeStorage();
  const [selectedMenu, setSelectedMenu] = useState('/dashboard');
  const [openKey, setOpenKey] = useState('');
  const dispatch = useDispatch<Dispatch>();
  const history = useHistory();
  const { t } = useTranslation(['menu']);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onModeChange = (mode: Mode) => {
    setIsNavOpen(true);
    updateUIMode(mode);
    dispatch.setting.setVSANMode(mode === 'VSAN');
    history.push(mode === 'VSAN' ? '/vsan/dashboard' : '/');
  };

  useEffect(() => {
    dispatch.auth.checkLoginStatus();
  }, [dispatch.auth]);

  useEffect(() => {
    if (typeof registered !== 'undefined' && !registered) {
      setIsModalOpen(true);
    }
  }, [registered]);

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

  const onNavToggleMobile = () => {
    setIsNavOpenMobile(!isNavOpenMobile);
  };
  const onNavToggle = () => {
    setIsNavOpen && setIsNavOpen(!isNavOpen);
  };
  const onPageResize = (props: { mobileView: boolean; windowSize: number }) => {
    setIsMobileView(props.mobileView);
  };

  const filteredRoutes = KVS?.gatewayEnabled ? routes : routes.filter((route) => route.label !== 'gateway');

  if (!KVS?.gatewayEnabled) {
    hideRoutes('gateway', filteredRoutes);
  }

  if (!KVS?.dashboardEnabled) {
    hideRoutes('grafana', filteredRoutes);
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

  function LogoImg() {
    const history = useHistory();

    function handleClick() {
      history.push(vsanModeFromSetting && KVS?.vsanMode ? '/vsan/dashboard' : '/');
    }

    return (
      <div className="logo_wrap">
        <img src={logo} className="logo" onClick={handleClick} alt="LINBIT Logo" />
        {'  '}
        <div className="customerlogo">{renderLogo(logoSrc)}</div>
      </div>
    );
  }

  const VSANAvailable = KVS?.vsanMode;
  const normalWithoutAuth = !VSANAvailable && !authenticationEnabled;

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
          >
            <ImgIcon src={logout} alt="logout" />
            <span>{t('common:logout')}</span>
          </a>
        ),
        hidden: !authenticationEnabled,
      },
    ],
  };

  const IS_DEV = process.env.NODE_ENV === 'development';

  const headerTools = (
    <PageHeaderTools>
      <PageHeaderToolsGroup>
        {!registered && (
          <PageHeaderToolsItem>
            <NoSupport>
              <WarningLogo src={warning} />
              <Attention>Attention! You are using an unsupported build.</Attention>
              <OfficialBuild onClick={handleSupportClick}>
                For Official Builds <OutLink src={outlink} className="outlink-svg" />
              </OfficialBuild>
            </NoSupport>
          </PageHeaderToolsItem>
        )}

        {vsanModeFromSetting && VSANEvalMode && (
          <PageHeaderToolsItem>
            <NoSupport>
              <WarningLogo src={warning} />
              <Attention>
                Your eval contract has expired. Please{' '}
                <a
                  href={
                    IS_DEV
                      ? process.env.VSAN_API_HOST + '/register.html'
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
          </PageHeaderToolsItem>
        )}

        <PageHeaderToolsItem>
          <ConnectStatus />
        </PageHeaderToolsItem>

        {!vsanModeFromSetting && (
          <PageHeaderToolsItem>
            <HeaderAboutModal />
          </PageHeaderToolsItem>
        )}

        {!vsanModeFromSetting && (
          <PageHeaderToolsItem>
            <LngSelector />
          </PageHeaderToolsItem>
        )}

        {!vsanModeFromSetting && (
          <PageHeaderToolsItem>
            <LogSidebar />
          </PageHeaderToolsItem>
        )}

        {!normalWithoutAuth && (
          <PageHeaderToolsItem>
            <Dropdown menu={menu} placement="bottomLeft">
              <Avatar
                size={40}
                style={{ backgroundColor: '#f7a75c', color: '#1e2939', cursor: 'pointer', marginLeft: 20 }}
              >
                {authInfo.username?.charAt(0).toUpperCase() || 'A'}
              </Avatar>
            </Dropdown>
          </PageHeaderToolsItem>
        )}
      </PageHeaderToolsGroup>
    </PageHeaderTools>
  );

  const Header = (
    <PageHeader
      logo={<LogoImg />}
      showNavToggle
      headerTools={headerTools}
      isNavOpen={Boolean(isNavOpen)}
      onNavToggle={isMobileView ? onNavToggleMobile : onNavToggle}
    />
  );

  const location = useLocation();

  const items: MenuItem[] = React.useMemo(() => {
    if (vsanModeFromSetting) {
      return [
        getItem(<Link to="/vsan/dashboard">Dashboard</Link>, '/vsan/dashboard', <PieChartOutlined />),
        getItem(
          <Link to="/vsan/physical-storage">Physical Storage</Link>,
          '/vsan/physical-storage',
          <DesktopOutlined />,
        ),
        getItem(
          <Link to="/vsan/resource-groups">Resource Groups</Link>,
          '/vsan/resource-groups',
          <ContainerOutlined />,
        ),
        getItem(<Link to="/vsan/iscsi">iSCSI</Link>, '/vsan/iscsi', <MailOutlined />),
        getItem(<Link to="/vsan/nvmeof">NVMe-oF</Link>, '/vsan/nvmeof', <AppstoreOutlined />),
        getItem(<Link to="/vsan/nfs">NFS</Link>, '/vsan/nfs', <CloudServerOutlined />),
        getItem(<Link to="/vsan/error-reports">Error Reports</Link>, '/vsan/error-reports', <WarningOutlined />),
        getItem(<Link to="/vsan/users">Users</Link>, '/vsan/users', <UserOutlined />),
        getItem(<Link to="/vsan/about">About</Link>, '/vsan/about', <InfoCircleOutlined />),
      ];
    } else {
      const normalItems = [
        getItem(<Link to="/">{t('dashboard')}</Link>, '/', <PieChartOutlined />),
        getItem(`${t('inventory')}`, '/inventory', <DesktopOutlined />, [
          getItem(<Link to="/inventory/nodes">{t('node')}</Link>, '/inventory/nodes'),
          getItem(<Link to="/inventory/controller">{t('controller')}</Link>, '/inventory/controller'),
          getItem(<Link to="/inventory/storage-pools">{t('storage_pools')}</Link>, '/inventory/storage-pools'),
        ]),
        getItem(`${t('software_defined')}`, '/storage-configuration', <DatabaseOutlined />, [
          getItem(
            <Link to="/storage-configuration/resource-groups">{t('resource_groups')}</Link>,
            '/storage-configuration/resource-groups',
          ),
          getItem(
            <Link to="/storage-configuration/resource-definitions">{t('resource_definitions')}</Link>,
            '/storage-configuration/resource-definitions',
          ),
          getItem(
            <Link to="/storage-configuration/volume-definitions">{t('volume_definitions')}</Link>,
            '/storage-configuration/volume-definitions',
          ),
          getItem(
            <Link to="/storage-configuration/resources">{t('resources')}</Link>,
            '/storage-configuration/resources',
          ),
          getItem(<Link to="/storage-configuration/volumes">{t('volumes')}</Link>, '/storage-configuration/volumes'),
        ]),
        getItem(<Link to="/remote/list">{t('remotes')}</Link>, '/remote/list', <CloudServerOutlined />),
        getItem(<Link to="/snapshot">{t('snapshot')}</Link>, '/snapshot', <FileProtectOutlined />),
        getItem(<Link to="/error-reports">{t('error_reports')}</Link>, '/error-reports', <WarningOutlined />),
      ];

      const settingsAndUsers = [
        getItem(<Link to="/users">{t('users')}</Link>, '/users', <UserOutlined />),
        getItem(<Link to="/settings">{t('settings')}</Link>, '/settings', <SettingOutlined />),
      ];

      const gatewayItems = [
        getItem('Gateway', '/gateway', <NodeIndexOutlined />, [
          getItem(<Link to="/gateway/nfs">NFS</Link>, '/gateway/nfs'),
          getItem(<Link to="/gateway/iscsi">iSCSI</Link>, '/gateway/iscsi'),
          getItem(<Link to="/gateway/nvme-of">NVMe-oF</Link>, '/gateway/nvme-of'),
        ]),
      ];

      const grafanaItem = [
        {
          key: '/grafana',
          label: <Link to="/grafana">Grafana</Link>,
          icon: <PieChartOutlined />,
        },
      ];

      const itemsRes = [
        ...normalItems,
        ...(KVS?.dashboardEnabled ? grafanaItem : []),
        ...(KVS?.gatewayEnabled && gatewayAvailable ? gatewayItems : []),
        ...(!authenticationEnabled || isAdmin ? settingsAndUsers : []),
      ];

      return itemsRes;
    }
  }, [
    KVS?.dashboardEnabled,
    KVS?.gatewayEnabled,
    authenticationEnabled,
    gatewayAvailable,
    isAdmin,
    t,
    vsanModeFromSetting,
  ]);

  useEffect(() => {
    const currentMenu = items.find(
      (e) => e?.key === location.pathname || (e as any)?.children?.find((c) => c.key === location.pathname),
    ) as any;

    if (currentMenu) {
      setOpenKey(currentMenu.key);
    }

    if (currentMenu?.children) {
      setSelectedMenu(currentMenu.children.find((c) => c.key === location.pathname)?.key as string);
    } else {
      setSelectedMenu(currentMenu?.key as string);
    }
  }, [location, items]);

  const Navigation = (
    <SideMenu>
      <Menu
        defaultSelectedKeys={[selectedMenu]}
        mode="inline"
        theme="dark"
        inlineCollapsed={false}
        items={items}
        style={{ backgroundColor: 'transparent' }}
        selectedKeys={[selectedMenu]}
      />
    </SideMenu>
  );

  const Sidebar = <PageSidebar theme="dark" nav={Navigation} isNavOpen={isMobileView ? isNavOpenMobile : isNavOpen} />;

  const pageId = 'primary-app-container';

  const PageSkipToContent = (
    <SkipToContent
      onClick={(event) => {
        event.preventDefault();
        const primaryContentContainer = document.getElementById(pageId);
        primaryContentContainer && primaryContentContainer.focus();
      }}
      href={`#${pageId}`}
    >
      Skip to Content
    </SkipToContent>
  );

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
      <Page
        mainContainerId={pageId}
        header={Header}
        sidebar={Sidebar}
        onPageResize={onPageResize}
        skipToContent={PageSkipToContent}
      >
        {children}
      </Page>

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
          <Content>
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
          </Content>
        </ModalContent>
      </StyledModal>
    </>
  );
};

export { AppLayout };
