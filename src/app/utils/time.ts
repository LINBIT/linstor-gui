// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import dayjs from 'dayjs';

import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

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

export const formatTimeUTC = (unixTime: number, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  const time = dayjs(unixTime).utc();
  return dayjs(time).format(format);
};

export const getTime = (time: string | number | Date | dayjs.Dayjs | null | undefined) => {
  return dayjs(time).valueOf();
};
