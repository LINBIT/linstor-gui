// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  createS3Remote: vi.fn(),
  createLINSTORRemote: vi.fn(),
}));

import { createS3Remote, createLINSTORRemote } from '../../api';
import { CreateRemoteForm } from '../CreateRemoteForm';

const renderForm = () => {
  const client = new QueryClient({ logger: { log: () => {}, warn: () => {}, error: () => {} } });
  const refetch = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <CreateRemoteForm refetch={refetch} />
    </QueryClientProvider>,
  );
  return refetch;
};

const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: '+ Add' }));
  await screen.findByPlaceholderText('Please input name');
};

const type = (placeholder: string, value: string) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });

const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

const expectModalClosed = () =>
  waitFor(() => {
    const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
    expect(!wrap || wrap.style.display === 'none').toBe(true);
  });

describe('CreateRemoteForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createS3Remote).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    vi.mocked(createLINSTORRemote).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('starts as an S3 remote and refuses to post empty fields', async () => {
    const refetch = renderForm();
    await open();
    expect(screen.getByPlaceholderText('Please input endpoint')).toBeInTheDocument();
    submit();
    await waitFor(() => expect(document.querySelectorAll('.ant-form-item-explain-error').length).toBeGreaterThan(0));
    expect(createS3Remote).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });

  it('posts an S3 remote with path style off by default, then closes and refreshes', async () => {
    const refetch = renderForm();
    await open();
    type('Please input name', 's3-a');
    type('Please input endpoint', 'http://minio:9000');
    type('Please input bucket', 'linstor');
    type('Please input region', 'eu-central');
    type('Please input access key', 'AKIA');
    type('Please input secret key', 'shhh');
    submit();

    await waitFor(() =>
      expect(createS3Remote).toHaveBeenCalledWith({
        remote_name: 's3-a',
        endpoint: 'http://minio:9000',
        bucket: 'linstor',
        region: 'eu-central',
        access_key: 'AKIA',
        secret_key: 'shhh',
        use_path_style: false,
      }),
    );
    expect(createLINSTORRemote).not.toHaveBeenCalled();
    await waitFor(() => expect(refetch).toHaveBeenCalled());
    await expectModalClosed();
  });

  it('sends path style when switched on', async () => {
    renderForm();
    await open();
    type('Please input name', 's3-p');
    type('Please input endpoint', 'e');
    type('Please input bucket', 'b');
    type('Please input region', 'r');
    type('Please input access key', 'a');
    type('Please input secret key', 's');
    fireEvent.click(screen.getByRole('switch'));
    submit();
    await waitFor(() => expect(createS3Remote).toHaveBeenCalledWith(expect.objectContaining({ use_path_style: true })));
  });

  it('a LINSTOR remote only needs a name and a URL', async () => {
    renderForm();
    await open();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('linstor_remotes', { selector: '.ant-select-item-option-content' }));
    expect(screen.queryByPlaceholderText('Please input endpoint')).not.toBeInTheDocument();
    type('Please input name', 'lin-b');
    type('Please input url', 'http://other:3370');
    submit();
    await waitFor(() =>
      expect(createLINSTORRemote).toHaveBeenCalledWith({ remote_name: 'lin-b', url: 'http://other:3370' }),
    );
    expect(createS3Remote).not.toHaveBeenCalled();
  });

  it('EBS remotes cannot be chosen', async () => {
    renderForm();
    await open();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    const ebs = await screen.findByText('ebs_remotes', { selector: '.ant-select-item-option-content' });
    expect(ebs.closest('.ant-select-item')).toHaveClass('ant-select-item-option-disabled');
  });

  it("shows the controller's error messages when the create is refused", async () => {
    vi.mocked(createS3Remote).mockResolvedValue({
      error: [{ message: 'bucket does not exist' }, { message: 'check the region' }],
    } as never);
    renderForm();
    await open();
    type('Please input name', 's3-x');
    type('Please input endpoint', 'e');
    type('Please input bucket', 'b');
    type('Please input region', 'r');
    type('Please input access key', 'a');
    type('Please input secret key', 's');
    submit();
    expect(await screen.findByText('bucket does not exist, check the region')).toBeInTheDocument();
  });

  it('reports a transport failure', async () => {
    vi.mocked(createLINSTORRemote).mockRejectedValue(new Error('offline'));
    renderForm();
    await open();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('linstor_remotes', { selector: '.ant-select-item-option-content' }));
    type('Please input name', 'lin-x');
    type('Please input url', 'http://x');
    submit();
    expect(await screen.findByText('Create remote error')).toBeInTheDocument();
  });
});
