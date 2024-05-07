import * as React from 'react';
import { Link, useLocation, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

import { Avatar, Dropdown, Menu, MenuProps } from 'antd';

import SVG from 'react-inlinesvg';

import { routes } from '@app/routes/routes';

import HeaderAboutModal from './components/HeaderAboutModal';
import ConnectStatus from './components/ConnectStatus';
import LngSelector from './components/LngSelector';

import logo from '@app/bgimages/Linbit_Logo_White-1.png';
import logout from '@app/assets/logout.svg';
import user from '@app/assets/user.svg';

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
  DeploymentUnitOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PieChartOutlined,
  SettingOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { BRAND_COLOR } from '@app/const/color';

interface IAppLayout {
  children: React.ReactNode;
}

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

const AppLayout: React.FunctionComponent<IAppLayout> = ({ children }) => {
  const [isNavOpen, setIsNavOpen] = usePersistentMenuState(true);
  const [isMobileView, setIsMobileView] = useState(true);
  const [isNavOpenMobile, setIsNavOpenMobile] = useState(false);
  const { UIMode, updateUIMode } = useUIModeStorage();
  const [selectedMenu, setSelectedMenu] = useState('/dashboard');
  const dispatch = useDispatch<Dispatch>();
  const history = useHistory();

  const onModeChange = (mode) => {
    setIsNavOpen(true);
    updateUIMode(mode);
    dispatch.setting.setVSANMode(mode === 'VSAN');
    history.push(mode === 'VSAN' ? '/vsan/dashboard' : '/');
  };

  useEffect(() => {
    dispatch.auth.checkLoginStatus();
  }, [dispatch.auth]);

  const { KVS, authInfo, logoSrc, vsanModeFromSetting } = useSelector((state: RootState) => ({
    KVS: state.setting.KVS,
    authInfo: state.auth,
    logoSrc: state.setting.logo,
    vsanModeFromSetting: state.setting.vsanMode,
  }));
  // if authenticationEnabled is false then just enter the page
  const authenticationEnabled = KVS?.authenticationEnabled;

  useEffect(() => {
    const VSAN_URL = history.location.pathname.includes('/vsan');
    const initialOpenFromVSAN =
      history.location.pathname === '/vsan/dashboard' && history.location.search === '?vsan=true';

    if (initialOpenFromVSAN) {
      dispatch.setting.initSettingStore(VSAN_URL);
    }

    if (VSAN_URL) {
      dispatch.setting.setVSANMode(true);
    }
  }, [dispatch.setting, history.location.pathname, history.location.search]);

  useEffect(() => {
    dispatch.setting.getSettings();
  }, [dispatch.setting]);

  const { t } = useTranslation('menu');
  const onNavToggleMobile = () => {
    setIsNavOpenMobile(!isNavOpenMobile);
  };
  const onNavToggle = () => {
    setIsNavOpen && setIsNavOpen(!isNavOpen);
  };
  const onPageResize = (props: { mobileView: boolean; windowSize: number }) => {
    setIsMobileView(props.mobileView);
  };

  let filteredRoutes = KVS?.gatewayEnabled ? routes : routes.filter((route) => route.label !== 'gateway');

  if (!KVS?.gatewayEnabled) {
    filteredRoutes = hideRoutes('gateway', filteredRoutes);
  }

  if (!KVS?.dashboardEnabled) {
    filteredRoutes = hideRoutes('grafana', filteredRoutes);
  }

  const customizedLogo = isSvg(logoSrc as any) ? logoSrc : null;

  function LogoImg() {
    const history = useHistory();

    function handleClick() {
      history.push(vsanModeFromSetting && KVS?.vsanMode ? '/vsan/dashboard' : '/');
    }

    return (
      <>
        <img src={logo} className="logo" onClick={handleClick} alt="LINBIT Logo" />
        {'  '}
        {customizedLogo && <SVG src={customizedLogo} className="Customized Logo" />}
      </>
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
            <span>User: {authInfo.username || 'admin'}</span>
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
            <span>Logout</span>
          </a>
        ),
        hidden: !authenticationEnabled,
      },
    ],
  };

  const headerTools = (
    <PageHeaderTools>
      <PageHeaderToolsGroup>
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

        {!normalWithoutAuth && (
          <PageHeaderToolsItem>
            <Dropdown menu={menu} placement="bottom">
              <Avatar size={40} style={{ backgroundColor: '#f7a75c', color: '#1e2939', cursor: 'pointer' }}>
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
          <DesktopOutlined />
        ),
        getItem(
          <Link to="/vsan/resource-groups">Resource Groups</Link>,
          '/vsan/resource-groups',
          <ContainerOutlined />
        ),
        getItem(<Link to="/vsan/iscsi">iSCSI</Link>, '/vsan/iscsi', <MailOutlined />),
        getItem(<Link to="/vsan/nvmeof">NVMe-oF</Link>, '/vsan/nvmeof', <AppstoreOutlined />),
        getItem(<Link to="/vsan/nfs">NFS</Link>, '/vsan/nfs', <CloudServerOutlined />),
        getItem(<Link to="/vsan/error-reports">Error Reports</Link>, '/vsan/error-reports', <WarningOutlined />),
        getItem(<Link to="/vsan/users">Users</Link>, '/vsan/users', <UserOutlined />),
        getItem(<Link to="/vsan/about">About</Link>, '/vsan/about', <InfoCircleOutlined />),
      ];
    } else {
      return [
        getItem(<Link to="/">Dashboard</Link>, '/', <PieChartOutlined />),
        getItem('Inventory', '/inventory', <DesktopOutlined />, [
          getItem(<Link to="/inventory/nodes">Nodes</Link>, '/inventory/nodes'),
          getItem(<Link to="/inventory/storage-pools">Storage Pools</Link>, '/inventory/storage-pools'),
          getItem(<Link to="/inventory/ip">IP Addresses</Link>, '/inventory/ip'),
        ]),
        getItem('Storage Configuration', '/storage-configuration', <DesktopOutlined />, [
          getItem(
            <Link to="/storage-configuration/resource-groups">Resource Groups</Link>,
            '/storage-configuration/resource-groups'
          ),
          getItem(
            <Link to="/storage-configuration/resource-definitions">Resource Definitions</Link>,
            '/storage-configuration/resource-definitions'
          ),
          getItem(
            <Link to="/storage-configuration/volume-definitions">Volume Definitions</Link>,
            '/storage-configuration/volume-definitions'
          ),
          getItem(<Link to="/storage-configuration/resources">Resources</Link>, '/storage-configuration/resources'),
          getItem(<Link to="/storage-configuration/volumes">Volumes</Link>, '/storage-configuration/volumes'),
        ]),
        getItem(<Link to="/snapshot">Snapshots</Link>, '/snapshot', <UserOutlined />),
        getItem(<Link to="/error-reports">Error Reports</Link>, '/error-reports', <WarningOutlined />),
        getItem(<Link to="/settings">Settings</Link>, '/settings', <UserOutlined />),
        getItem(<Link to="/users">Users</Link>, '/users', <UserOutlined />),
      ];
    }
  }, [vsanModeFromSetting]);

  useEffect(() => {
    const currentMenu = items.find(
      (e) => e?.key === location.pathname || (e as any)?.children?.find((c) => c.key === location.pathname)
    ) as any;

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
    </>
  );
};

export { AppLayout };
