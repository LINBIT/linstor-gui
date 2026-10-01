// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMutation } from '@tanstack/react-query';
import { Button } from '@app/components/Button';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { get, unwrap } from '@app/features/requests';

const generateFileName = () => {
  const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
  return `sos_${timestamp}.tar.gz`;
};

const downloadFile = async () => {
  const blob = await unwrap(get('/v1/sos-report/download', { parseAs: 'blob' }));
  const url = window.URL.createObjectURL(blob as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', generateFileName());
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const DownloadSOS = () => {
  const download = useMutation({ mutationFn: downloadFile });

  const { t } = useTranslation('error_report');

  return (
    <Button type="primary" onClick={() => download.mutate()} loading={download.isPending}>
      {t('download_sos')}
    </Button>
  );
};

export default DownloadSOS;
