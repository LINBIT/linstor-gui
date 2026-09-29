// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@app/features/requests', async (importOriginal) => ({
  unwrap: (await importOriginal<typeof import('@app/features/requests')>()).unwrap,
  get: vi.fn(),
}));

import { get } from '@app/features/requests';
import DownloadSOS from '../DownloadSOS';

const renderButton = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  render(
    <QueryClientProvider client={client}>
      <DownloadSOS />
    </QueryClientProvider>,
  );
};

describe('DownloadSOS', () => {
  const createObjectURL = vi.fn(() => 'blob:sos');
  const revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom has no object URLs.
    Object.defineProperty(window.URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    vi.mocked(get).mockResolvedValue({ data: new Blob([new Uint8Array([1, 2, 3])]) } as never);
  });

  afterEach(() => {
    click.mockClear();
  });

  it('does nothing until clicked', () => {
    renderButton();
    expect(screen.getByRole('button', { name: 'Download SOS Report' })).toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
  });

  it('fetches the archive as a blob and hands it to the browser as a timestamped tar.gz', async () => {
    renderButton();
    fireEvent.click(screen.getByRole('button', { name: 'Download SOS Report' }));

    await waitFor(() => expect(get).toHaveBeenCalledWith('/v1/sos-report/download', { parseAs: 'blob' }));
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));

    const link = click.mock.instances[0] as HTMLAnchorElement;
    expect(link.href).toBe('blob:sos');
    expect(link.getAttribute('download')).toMatch(/^sos_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.tar\.gz$/);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:sos');
    // The temporary link must not be left in the page.
    expect(document.body.contains(link)).toBe(false);
  });

  it('re-enables the button when the download fails', async () => {
    // openapi-fetch resolves on an HTTP error; the download must still fail.
    vi.mocked(get).mockResolvedValue({ error: 'offline', response: { ok: false, status: 503 } } as never);
    renderButton();
    const button = screen.getByRole('button', { name: 'Download SOS Report' });
    fireEvent.click(button);
    await waitFor(() => expect(get).toHaveBeenCalled());
    await waitFor(() => expect(button.querySelector('.ant-btn-loading-icon')).toBeNull());
    expect(click).not.toHaveBeenCalled();
  });
});
