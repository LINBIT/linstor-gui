// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import HeaderTools from '../HeaderTools';
import { getControllerVersion, getControllerConfig } from '@app/features/node/api';
import { getPassphraseStatus } from '@app/features/settings/passphrase';
import { DEFAULT_ADMIN_USER_NAME } from '@app/const/settings';

const hoisted = vi.hoisted(() => ({
  logout: vi.fn(),
  faulty: [] as unknown[],
}));

vi.mock('@app/features/node/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/node/api')>()),
  getControllerVersion: vi.fn(),
  getControllerConfig: vi.fn(),
}));

vi.mock('@app/features/settings/passphrase', () => ({
  getPassphraseStatus: vi.fn(),
  createPassphrase: vi.fn(),
  enterPassPhrase: vi.fn(),
}));

vi.mock('@app/features/resource/hooks/useFaultyResources', () => ({
  useFaultyResources: () => ({ data: hoisted.faulty }),
}));

vi.mock('@app/features/authentication/components/ChangePassword/ChangePassword', () => ({
  ChangePassword: () => <span>Change password</span>,
}));

vi.mock('react-redux', () => ({
  useDispatch: () => ({ auth: { logout: hoisted.logout } }),
  useSelector: (selector: (s: unknown) => unknown) => selector({ setting: { mode: 'NORMAL' } }),
}));

const mockedVersion = vi.mocked(getControllerVersion);
const mockedConfig = vi.mocked(getControllerConfig);
const mockedPassphrase = vi.mocked(getPassphraseStatus);

type Props = React.ComponentProps<typeof HeaderTools>;

const renderTools = (props: Partial<Props> = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  const onModeChange = vi.fn();
  const handleSupportClick = vi.fn();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HeaderTools
          authInfo={{ username: 'bob' }}
          authenticationEnabled
          onModeChange={onModeChange}
          handleSupportClick={handleSupportClick}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, onModeChange, handleSupportClick };
};

const waitForVersion = () => waitFor(() => expect(mockedVersion).toHaveBeenCalled());

const openUserMenu = async (container: HTMLElement) => {
  const trigger = container.querySelector('.cursor-pointer') as HTMLElement;
  expect(trigger).not.toBeNull();
  fireEvent.mouseEnter(trigger);
  return screen.findByRole('menu');
};

const passphraseRoot = (container: HTMLElement) => container.querySelector('.text-base');

// antd forwards the item `hidden` flag to the <li>, so hidden entries stay in the DOM.
const visibleItems = (menu: HTMLElement) =>
  within(menu)
    .getAllByRole('menuitem')
    .filter((item) => !item.hidden)
    .map((item) => item.textContent?.trim() ?? '');

describe('HeaderTools', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    hoisted.faulty = [];
    mockedVersion.mockResolvedValue({ data: { rest_api_version: '1.30.0' } } as never);
    mockedConfig.mockResolvedValue({ data: {} } as never);
    mockedPassphrase.mockResolvedValue({ data: { status: 'locked' } } as never);
  });

  it('renders the connection status, passphrase, logs, language and about tools', async () => {
    const { container } = renderTools();
    await waitForVersion();

    await waitFor(() => expect(container.querySelector('.connect__status')).not.toBeNull());
    await waitFor(() => expect(passphraseRoot(container)).not.toBeNull());
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(await screen.findByTitle('LINSTOR GUI Info')).toBeInTheDocument();
    expect(screen.queryByText(/unsupported build/)).toBeNull();
    expect(screen.queryByText(/eval contract/)).toBeNull();
  });

  it('omits the passphrase prompt on controllers older than 1.25.0', async () => {
    mockedVersion.mockResolvedValue({ data: { rest_api_version: '1.20.0' } } as never);
    const { container } = renderTools();
    await waitForVersion();

    await screen.findByTitle('LINSTOR GUI Info');
    expect(passphraseRoot(container)).toBeNull();
  });

  it('strips the logs, language, about and user tools in VSAN mode', async () => {
    const { container } = renderTools({ vsanModeFromSetting: true, VSANAvailable: true });
    await waitForVersion();

    expect(screen.queryByText('EN')).toBeNull();
    expect(screen.queryByTitle('LINSTOR GUI Info')).toBeNull();
    const menu = await openUserMenu(container);
    expect(visibleItems(menu)).toContain('Switch to advanced mode');
  });

  it('shows the unofficial build banner with a link to support', async () => {
    const { handleSupportClick } = renderTools({ isNotOfficialBuild: true });
    await waitForVersion();

    expect(screen.getByText('Attention! You are using an unsupported build.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('For Official Builds'));
    expect(handleSupportClick).toHaveBeenCalledTimes(1);
  });

  it('warns about an expired eval contract with a re-register link', async () => {
    renderTools({ vsanModeFromSetting: true, VSANEvalMode: true });
    await waitForVersion();

    expect(screen.getByText(/eval contract has expired/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 're-register' })).toHaveAttribute(
      'href',
      `https://${window.location.hostname}/register.html`,
    );
  });

  it('links to the dashboard when there are faulty resources', async () => {
    hoisted.faulty = [{ name: 'r1' }];
    const { container } = renderTools();
    await waitForVersion();

    const link = container.querySelector('a[href="/"]');
    expect(link).not.toBeNull();
    fireEvent.mouseEnter(link as HTMLElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Has faulty resources');
  });

  it('lists the user, change password and logout in the user menu', async () => {
    const { container } = renderTools();
    await waitForVersion();

    const menu = await openUserMenu(container);
    expect(visibleItems(menu)).toEqual(['User: bob', 'Change password', 'Logout']);

    fireEvent.click(screen.getByText('Logout'));
    expect(hoisted.logout).toHaveBeenCalledTimes(1);
  });

  it('falls back to the default admin name and drops auth-only items when authentication is off', async () => {
    const { container } = renderTools({ authInfo: { username: '' }, authenticationEnabled: false });
    await waitForVersion();

    const menu = await openUserMenu(container);
    expect(visibleItems(menu)).toEqual([`User: ${DEFAULT_ADMIN_USER_NAME}`]);
  });

  it('hides the user menu without authentication in normal mode and in HCI mode', async () => {
    const { container, unmount } = renderTools({ normalWithoutAuth: true });
    await waitForVersion();
    expect(container.querySelector('.cursor-pointer')).toBeNull();
    unmount();

    const second = renderTools({ hciModeFromSetting: true });
    await waitForVersion();
    expect(second.container.querySelector('.cursor-pointer')).toBeNull();
  });

  it('switches between the normal and the VSAN mode from the user menu', async () => {
    const { container, onModeChange, unmount } = renderTools({ VSANAvailable: true });
    await waitForVersion();

    await openUserMenu(container);
    fireEvent.click(screen.getByText('Leave advanced mode'));
    expect(onModeChange).toHaveBeenCalledWith('VSAN');
    unmount();

    const vsan = renderTools({ VSANAvailable: true, vsanModeFromSetting: true });
    await waitForVersion();
    await openUserMenu(vsan.container);
    fireEvent.click(screen.getByText('Switch to advanced mode'));
    expect(vsan.onModeChange).toHaveBeenCalledWith('NORMAL');
  });
});
