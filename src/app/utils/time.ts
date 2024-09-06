// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import dayjs from 'dayjs';

/**
 * Convert time
 * @param unixTime timestamp
 * @param format time format
 * @returns time string
 */
export const formatTime = (unixTime: number, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  const time = dayjs(unixTime);
  return dayjs(time).format(format);
};

export const getTime = (time) => {
  return dayjs(time).valueOf();
};
