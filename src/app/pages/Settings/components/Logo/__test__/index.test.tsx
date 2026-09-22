// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen, fireEvent, waitFor } from '@testing-library/react';

import Logo from '..';
import { renderSettings } from '../../../__test__/helpers';

const hoisted = vi.hoisted(() => ({
  dispatch: { setting: { setLogo: vi.fn(), disableCustomLogo: vi.fn() } },
  state: { setting: { logo: '', KVS: { customLogoEnabled: false } as Record<string, unknown> } },
}));

vi.mock('react-redux', () => ({
  useDispatch: () => hoisted.dispatch,
  useSelector: (selector: (s: unknown) => unknown) => selector(hoisted.state),
}));

// react-inlinesvg fetches the markup; the assertion is that it is asked to.
vi.mock('react-inlinesvg', () => ({
  default: ({ src, className }: { src: string; className?: string }) => (
    <div data-testid="inline-svg" data-src={src} className={className} />
  ),
}));

const SVG_LOGO = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" /></svg>';

const enableCustomLogo = () => fireEvent.click(screen.getByRole('switch'));
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('Settings logo tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.state.setting = { logo: '', KVS: { customLogoEnabled: false } };
  });

  it('offers nothing but the switch until a custom logo is enabled', () => {
    renderSettings(<Logo />);

    expect(screen.getByRole('switch')).not.toBeChecked();
    expect(screen.queryByPlaceholderText('https://example.com/logo.svg')).toBeNull();
    expect(screen.queryByRole('button', { name: /Upload/ })).toBeNull();
  });

  it('reveals the upload and URL fields once enabled', () => {
    renderSettings(<Logo />);
    enableCustomLogo();

    expect(screen.getByPlaceholderText('https://example.com/logo.svg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload/ })).toBeInTheDocument();
  });

  it('prefills the URL from a stored logo that is a link', async () => {
    hoisted.state.setting = { logo: 'https://linbit.com/logo.svg', KVS: { customLogoEnabled: true } };
    renderSettings(<Logo />);

    await waitFor(() => expect(screen.getByRole('switch')).toBeChecked());
    await waitFor(() =>
      expect(screen.getByPlaceholderText('https://example.com/logo.svg')).toHaveValue('https://linbit.com/logo.svg'),
    );
    expect(screen.getByRole('img', { name: 'logo' })).toHaveAttribute('src', 'https://linbit.com/logo.svg');
  });

  it('renders a stored inline SVG instead of an image', async () => {
    hoisted.state.setting = { logo: SVG_LOGO, KVS: { customLogoEnabled: true } };
    renderSettings(<Logo />);

    await waitFor(() => expect(screen.getByTestId('inline-svg')).toHaveAttribute('data-src', SVG_LOGO));
    expect(screen.queryByRole('img', { name: 'logo' })).toBeNull();
    // An inline SVG is not a URL, so the URL field stays empty.
    expect(screen.getByPlaceholderText('https://example.com/logo.svg')).toHaveValue('');
  });

  it('shows no preview for a stored logo that is neither a URL nor an SVG', async () => {
    hoisted.state.setting = { logo: 'not-a-logo', KVS: { customLogoEnabled: true } };
    const { container } = renderSettings(<Logo />);

    await waitFor(() => expect(screen.getByRole('switch')).toBeChecked());
    expect(screen.queryByRole('img', { name: 'logo' })).toBeNull();
    expect(screen.queryByTestId('inline-svg')).toBeNull();
    expect(container.querySelector('.ant-form-item')).not.toBeNull();
  });

  it('saves a URL logo, clearing any inline SVG', async () => {
    renderSettings(<Logo />);
    enableCustomLogo();

    fireEvent.change(screen.getByPlaceholderText('https://example.com/logo.svg'), {
      target: { value: 'https://linbit.com/logo.svg' },
    });
    save();

    await waitFor(() =>
      expect(hoisted.dispatch.setting.setLogo).toHaveBeenCalledWith({
        logoSvg: '',
        logoUrl: 'https://linbit.com/logo.svg',
      }),
    );
    expect(hoisted.dispatch.setting.disableCustomLogo).not.toHaveBeenCalled();
  });

  it('turning the switch off disables the custom logo rather than saving one', async () => {
    hoisted.state.setting = { logo: 'https://linbit.com/logo.svg', KVS: { customLogoEnabled: true } };
    renderSettings(<Logo />);

    await waitFor(() => expect(screen.getByRole('switch')).toBeChecked());
    fireEvent.click(screen.getByRole('switch'));
    save();

    await waitFor(() => expect(hoisted.dispatch.setting.disableCustomLogo).toHaveBeenCalled());
    expect(hoisted.dispatch.setting.setLogo).not.toHaveBeenCalled();
  });

  it('saves an uploaded SVG inline', async () => {
    const { container } = renderSettings(<Logo />);
    enableCustomLogo();

    const file = new File([SVG_LOGO], 'logo.svg', { type: 'image/svg+xml' });
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLElement, { target: { files: [file] } });

    await waitFor(() => expect(container.querySelector('.ant-upload-list-item')).not.toBeNull());
    // beforeUpload hands the file to a FileReader, which lands a macrotask
    // later than its own return; Save reads that content synchronously.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    save();

    await waitFor(() => expect(hoisted.dispatch.setting.setLogo).toHaveBeenCalledWith({ logoSvg: SVG_LOGO }));
  });

  it('refuses an SVG larger than 16 KiB', async () => {
    const { container } = renderSettings(<Logo />);
    enableCustomLogo();

    const tooBig = new File(['x'.repeat(16 * 1024 + 1)], 'logo.svg', { type: 'image/svg+xml' });
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLElement, { target: { files: [tooBig] } });

    expect(await screen.findAllByText('The logo file size should not exceed 16KB.')).not.toHaveLength(0);
    save();
    await waitFor(() => expect(hoisted.dispatch.setting.setLogo).not.toHaveBeenCalled());
  });
});
