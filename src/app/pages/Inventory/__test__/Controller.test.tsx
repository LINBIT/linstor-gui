// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { Controller } from '../Controller';
import { getControllerProperties, getControllerPropertiesInfo, updateController } from '@app/features/node';
import { NavContext } from '@app/hooks/useNav';
import { renderPage, selectOption, confirmPopover, ok } from './helpers';

vi.mock('@app/features/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/node')>()),
  getControllerProperties: vi.fn(),
  getControllerPropertiesInfo: vi.fn(),
  updateController: vi.fn(),
}));

// The overview has its own suite.
vi.mock('../Controller/ControllerOverview', () => ({ ControllerOverview: () => null }));

vi.mock('@app/components/PropertyForm', () => ({
  default: ({ children, handleSubmit }: { children?: React.ReactNode; handleSubmit: (d: unknown) => void }) => (
    <div>
      {children}
      <button data-testid="property-form-submit" onClick={() => handleSubmit({ override_props: { 'Aux/new': '1' } })}>
        submit-property
      </button>
    </div>
  ),
}));

const properties = {
  'Aux/owner': 'team-a',
  'Auth/TokenAuthenticationEnabled': 'true',
  'Cluster/LocalID': '9b508d7c',
  'DrbdOptions/AutoEvictAllowEviction': 'true',
  'DrbdOptions/Resource/on-no-quorum': 'io-error',
  'DrbdOptions/Net/timeout': '60',
  'NetCom/SslConnector/KeyPasswd': 'linstor',
  'encrypted/masterkey': 'c2VjcmV0',
  'REST/AutoHTTPS': 'true',
  TcpPortAutoRange: '7000-7999',
  defaultPlainConSvc: 'PlainConnector',
};

const info = {
  'Auth/TokenAuthenticationEnabled': {
    info: 'Enables or disables the token authentication.',
    prop_type: 'boolean_true_false',
    value: '(?i)(?:true|false|yes|no)',
  },
  'DrbdOptions/AutoEvictAllowEviction': {
    info: 'If set to false on a node, it cannot be evicted anymore',
    prop_type: 'boolean_true_false',
    value: '(?i)(?:true|false|yes|no)',
    dflt: 'true',
  },
  'DrbdOptions/Resource/on-no-quorum': { prop_type: 'regex', value: '(?:io-error|suspend-io)' },
  'DrbdOptions/Net/timeout': { prop_type: 'range', value: '(1 - 600)', dflt: '60', unit: '1/10 seconds' },
  TcpPortAutoRange: { info: 'Range for auto-allocation of resource TCP ports', prop_type: 'string' },
  'AutoDbExport/Cron': {
    info: "Cron syntax of when LINSTOR should export the database. Use 'off' to disable this feature",
    prop_type: 'string',
    dflt: '0 4 * * *',
  },
  'AutoDbExport/Keep': { info: 'How many old database exports should LINSTOR keep', prop_type: 'long', dflt: '7' },
};

const failed = { data: [{ ret_code: -1, message: 'invalid value' }] };

const nav = { isNavOpen: true, toggleNav: () => undefined, setNavOpen: () => undefined };

const renderController = async () => {
  const utils = renderPage(
    <NavContext.Provider value={nav}>
      <Controller />
    </NavContext.Provider>,
  );
  await screen.findByText('Aux/owner');
  await screen.findByText('Enables or disables the token authentication.');
  return utils;
};

/** The row of a property: the element holding its name, value and buttons. */
const row = (name: string) => screen.getByText(name).parentElement!.parentElement as HTMLElement;

const edit = (name: string) => fireEvent.click(within(row(name)).getByRole('button', { name: `Edit ${name}` }));
const save = (name: string) => fireEvent.click(within(row(name)).getByRole('button', { name: 'Save' }));

describe('Controller page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getControllerProperties).mockResolvedValue({ data: properties } as never);
    vi.mocked(getControllerPropertiesInfo).mockResolvedValue({ data: info } as never);
    vi.mocked(updateController).mockResolvedValue(ok as never);
  });

  it('shows skeleton rows, not an empty list, until the properties have arrived', async () => {
    vi.mocked(getControllerProperties).mockReturnValue(new Promise(() => {}) as never);
    const { container } = renderPage(
      <NavContext.Provider value={nav}>
        <Controller />
      </NavContext.Provider>,
    );

    expect(await screen.findByText('Controller Properties')).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"] .ant-skeleton')).not.toBeNull();
    expect(screen.queryByText('No property matches')).toBeNull();
    expect(container.querySelector('.ant-collapse')).toBeNull();
  });

  it('groups the properties by namespace, Aux first, with the description and default the controller gives', async () => {
    const { container } = await renderController();

    const headers = Array.from(container.querySelectorAll('.ant-collapse-header')).map((h) => h.textContent);
    expect(headers).toEqual([
      'Custom (Aux/)1',
      'Auth1',
      'AutoDbExport2',
      'Cluster1',
      'DrbdOptions3',
      'encrypted1',
      'NetCom1',
      'REST1',
      'Other2',
    ]);
    // The connector definitions and the properties without a namespace start collapsed.
    const open = Array.from(container.querySelectorAll('.ant-collapse-item-active .ant-collapse-header'));
    expect(open.map((h) => h.textContent)).not.toContain('NetCom1');
    expect(open.map((h) => h.textContent)).not.toContain('Other2');
    expect(row('DrbdOptions/AutoEvictAllowEviction')).toHaveTextContent('If set to false on a node');
    expect(within(row('DrbdOptions/AutoEvictAllowEviction')).getByText('Default')).toBeInTheDocument();
    expect(within(row('DrbdOptions/Resource/on-no-quorum')).queryByText('Default')).toBeNull();
    expect(row('DrbdOptions/Net/timeout')).toHaveTextContent('60 1/10 seconds');
  });

  it('shows the automatic database export settings with their defaults while unset', async () => {
    await renderController();

    expect(row('AutoDbExport/Cron')).toHaveTextContent('0 4 * * *');
    expect(within(row('AutoDbExport/Cron')).getByText('Default')).toBeInTheDocument();
    // Nothing to delete: it is not set.
    expect(within(row('AutoDbExport/Cron')).queryByRole('button', { name: /Delete/ })).toBeNull();
  });

  it('masks passwords and encryption keys until revealed', async () => {
    const { container } = await renderController();

    expect(container).not.toHaveTextContent('c2VjcmV0');
    fireEvent.click(screen.getByText('NetCom'));
    await screen.findByText('NetCom/SslConnector/KeyPasswd');
    expect(row('NetCom/SslConnector/KeyPasswd')).not.toHaveTextContent('linstor');

    fireEvent.click(within(row('encrypted/masterkey')).getByRole('button', { name: 'Show' }));
    expect(row('encrypted/masterkey')).toHaveTextContent('c2VjcmV0');
    fireEvent.click(within(row('encrypted/masterkey')).getByRole('button', { name: 'Hide' }));
    expect(row('encrypted/masterkey')).not.toHaveTextContent('c2VjcmV0');
  });

  it('offers no editing for the controller’s own state', async () => {
    await renderController();

    expect(within(row('encrypted/masterkey')).queryByRole('button', { name: /Edit/ })).toBeNull();
    expect(within(row('Cluster/LocalID')).queryByRole('button', { name: /Edit/ })).toBeNull();
  });

  it('sends a text value once, on Save, not while typing', async () => {
    await renderController();
    edit('Aux/owner');

    const input = within(row('Aux/owner')).getByRole('textbox', { name: 'Value of Aux/owner' });
    for (const value of ['t', 'te', 'team-b']) fireEvent.change(input, { target: { value } });
    expect(updateController).not.toHaveBeenCalled();

    save('Aux/owner');
    await waitFor(() => expect(updateController).toHaveBeenCalledWith({ override_props: { 'Aux/owner': 'team-b' } }));
    expect(updateController).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(within(row('Aux/owner')).queryByRole('textbox')).toBeNull());
  });

  it('cancels without sending anything', async () => {
    await renderController();
    edit('Aux/owner');
    fireEvent.change(within(row('Aux/owner')).getByRole('textbox'), { target: { value: 'x' } });
    fireEvent.click(within(row('Aux/owner')).getByRole('button', { name: 'Cancel' }));

    expect(updateController).not.toHaveBeenCalled();
    expect(row('Aux/owner')).toHaveTextContent('team-a');
  });

  it('picks a value from the choices the controller allows', async () => {
    await renderController();
    edit('DrbdOptions/Resource/on-no-quorum');
    await selectOption(within(row('DrbdOptions/Resource/on-no-quorum')).getByRole('combobox'), 'suspend-io');
    save('DrbdOptions/Resource/on-no-quorum');

    await waitFor(() =>
      expect(updateController).toHaveBeenCalledWith({
        override_props: { 'DrbdOptions/Resource/on-no-quorum': 'suspend-io' },
      }),
    );
  });

  it('switches a true/false property', async () => {
    await renderController();
    edit('Auth/TokenAuthenticationEnabled');
    fireEvent.click(within(row('Auth/TokenAuthenticationEnabled')).getByRole('switch'));
    save('Auth/TokenAuthenticationEnabled');

    await waitFor(() =>
      expect(updateController).toHaveBeenCalledWith({ override_props: { 'Auth/TokenAuthenticationEnabled': 'false' } }),
    );
  });

  it('enters a number within the documented range', async () => {
    await renderController();
    edit('DrbdOptions/Net/timeout');
    const input = within(row('DrbdOptions/Net/timeout')).getByRole('spinbutton');
    expect(input).toHaveAttribute('aria-valuemax', '600');
    fireEvent.change(input, { target: { value: '90' } });
    save('DrbdOptions/Net/timeout');

    await waitFor(() =>
      expect(updateController).toHaveBeenCalledWith({ override_props: { 'DrbdOptions/Net/timeout': '90' } }),
    );
  });

  it('stays in edit mode when the controller rejects the value', async () => {
    vi.mocked(updateController).mockResolvedValue(failed as never);
    await renderController();
    fireEvent.click(screen.getByText(/^Other/));
    await screen.findByText('TcpPortAutoRange');
    edit('TcpPortAutoRange');
    fireEvent.change(within(row('TcpPortAutoRange')).getByRole('textbox'), { target: { value: 'bad' } });
    save('TcpPortAutoRange');

    await waitFor(() => expect(updateController).toHaveBeenCalled());
    expect(within(row('TcpPortAutoRange')).getByRole('textbox')).toHaveValue('bad');
  });

  it('deletes a property after confirm', async () => {
    await renderController();
    fireEvent.click(within(row('Aux/owner')).getByRole('button', { name: 'Delete Aux/owner' }));
    await confirmPopover();

    await waitFor(() => expect(updateController).toHaveBeenCalledWith({ delete_props: ['Aux/owner'] }));
  });

  it('finds properties by name or description, opening the groups they are in', async () => {
    await renderController();
    const search = screen.getByRole('textbox', { name: 'Search properties' });

    fireEvent.change(search, { target: { value: 'evicted' } });
    expect(await screen.findByText('DrbdOptions/AutoEvictAllowEviction')).toBeInTheDocument();
    expect(screen.queryByText('Aux/owner')).toBeNull();

    fireEvent.change(search, { target: { value: 'keypasswd' } });
    expect(await screen.findByText('NetCom/SslConnector/KeyPasswd')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'nothing like this' } });
    expect(await screen.findByText('No property matches')).toBeInTheDocument();
  });

  it('adds a property through the property form', async () => {
    await renderController();
    fireEvent.click(screen.getByTestId('property-form-submit'));
    await waitFor(() => expect(updateController).toHaveBeenCalledWith({ override_props: { 'Aux/new': '1' } }));
  });
});
