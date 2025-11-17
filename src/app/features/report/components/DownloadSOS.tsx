// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@app/components/Button';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const generateFileName = () => {
  const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
  return `sos_${timestamp}.tar.gz`;
};

const downloadFile = async () => {
  const response = await axios.get('/v1/sos-report/download', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', generateFileName());
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const DownloadSOS = () => {
  const [downloading, setDownloading] = useState(false);
  const { refetch } = useQuery({
    queryKey: ['downloadSOS'],
    queryFn: () => downloadFile(),
    enabled: false,
  });

  const handleDownload = async () => {
    setDownloading(true);
    await refetch();
    setDownloading(false);
  };

  const { t } = useTranslation('error_report');

  return (
    <Button type="primary" onClick={handleDownload} loading={downloading}>
      {t('download_sos')}
    </Button>
  );
};

export default DownloadSOS;
