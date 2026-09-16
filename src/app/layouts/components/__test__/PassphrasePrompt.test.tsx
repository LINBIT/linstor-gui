// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import PassphrasePrompt from '../PassphrasePrompt';
import { getPassphraseStatus, createPassphrase, enterPassPhrase } from '@app/features/settings/passphrase';
import { logger } from '@app/utils/logger';

vi.mock('@app/features/settings/passphrase', () => ({
  getPassphraseStatus: vi.fn(),
  createPassphrase: vi.fn(),
  enterPassPhrase: vi.fn(),
}));

vi.mock('@app/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const mockedStatus = vi.mocked(getPassphraseStatus);
const mockedCreate = vi.mocked(createPassphrase);
const mockedEnter = vi.mocked(enterPassPhrase);

const status = (value: 'unset' | 'locked' | 'unlocked') => ({ data: { status: value } }) as never;

const renderPrompt = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return render(
    <QueryClientProvider client={client}>
      <PassphrasePrompt />
    </QueryClientProvider>,
  );
};

// Earlier tooltips stay in the DOM hidden, so look for the visible one.
const expectTooltip = async (target: HTMLElement, text: string) => {
  fireEvent.mouseEnter(target);
  await waitFor(() => {
    const visible = screen
      .getAllByRole('tooltip')
      .filter((tip) => !tip.closest('.ant-tooltip')?.classList.contains('ant-tooltip-hidden'));
    expect(visible.some((tip) => tip.textContent?.includes(text))).toBe(true);
  });
  fireEvent.mouseLeave(target);
};

const expectModalClosed = async () => {
  await waitFor(() => {
    const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
    expect(!wrap || wrap.style.display === 'none').toBe(true);
  });
};

describe('PassphrasePrompt', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a spinner while the status loads', () => {
    mockedStatus.mockReturnValue(new Promise(() => undefined) as never);
    const { container } = renderPrompt();
    expect(container.querySelector('.ant-spin')).not.toBeNull();
  });

  it('offers to set a passphrase when none is set and validates the confirmation', async () => {
    mockedStatus.mockResolvedValueOnce(status('unset')).mockResolvedValue(status('unlocked'));
    mockedCreate.mockResolvedValue({} as never);
    const { container } = renderPrompt();

    const icon = await waitFor(() => {
      const svg = container.querySelector('svg.cursor-pointer');
      expect(svg).not.toBeNull();
      return svg as SVGElement;
    });
    await expectTooltip(icon.parentElement as HTMLElement, 'Passphrase not set');

    fireEvent.click(icon);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Set Passphrase');

    fireEvent.click(screen.getByRole('button', { name: 'Set Passphrase' }));
    expect(await screen.findByText('Please input your passphrase!')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Passphrase'), { target: { value: 'secret' } });
    fireEvent.change(screen.getByLabelText('Confirm Passphrase'), { target: { value: 'other' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set Passphrase' }));
    expect(await screen.findByText('The two passphrases do not match!')).toBeInTheDocument();
    expect(mockedCreate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Confirm Passphrase'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set Passphrase' }));

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledWith('secret'));
    await expectModalClosed();
    const unlocked = await waitFor(() => {
      const el = container.querySelector('.inline-block:not(.cursor-pointer)');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    await expectTooltip(unlocked, 'LINSTOR is unlocked');
  });

  it('unlocks a locked controller with the entered passphrase', async () => {
    mockedStatus.mockResolvedValue(status('locked'));
    mockedEnter.mockResolvedValue({} as never);
    const { container } = renderPrompt();

    const lock = await waitFor(() => {
      const el = container.querySelector('.inline-block.cursor-pointer');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    await expectTooltip(lock, 'LINSTOR is locked');

    fireEvent.click(lock);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Unlock Passphrase');
    expect(screen.queryByLabelText('Confirm Passphrase')).toBeNull();

    fireEvent.change(screen.getByLabelText('Passphrase'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));

    await waitFor(() => expect(mockedEnter).toHaveBeenCalledWith('secret'));
    await expectModalClosed();
  });

  it('keeps the dialog open and logs when unlocking fails', async () => {
    mockedStatus.mockResolvedValue(status('locked'));
    mockedEnter.mockRejectedValue(new Error('wrong passphrase'));
    const { container } = renderPrompt();

    const lock = await waitFor(() => {
      const el = container.querySelector('.inline-block.cursor-pointer');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    fireEvent.click(lock);
    await screen.findByRole('dialog');

    fireEvent.change(screen.getByLabelText('Passphrase'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));

    await waitFor(() => expect(logger.error).toHaveBeenCalledWith('Failed to unlock passphrase:', expect.any(Error)));
    expect(screen.getByRole('dialog')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expectModalClosed();
  });

  it('does nothing on click when the controller is already unlocked', async () => {
    mockedStatus.mockResolvedValue(status('unlocked'));
    const { container } = renderPrompt();

    const unlocked = await waitFor(() => {
      const el = container.querySelector('.inline-block');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    fireEvent.click(unlocked);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
