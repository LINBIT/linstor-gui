// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { toast, ToastOptions } from 'react-toastify';
import { APICALLRCLIST } from '@app/features/requests';

const handleLinstorMessage = (e: { message: string; ret_code: number }) => {
  return { title: e.message, type: e.ret_code > 0 ? 'success' : 'error' };
};

const notify = (content: string, options?: ToastOptions): void => {
  if (!content) {
    return;
  }
  toast(content, {
    ...options,
  });
};

const handleAPICallRes = (callRes?: APICALLRCLIST) => {
  if (!callRes || !callRes.length) {
    return;
  }

  const normalRes = callRes.filter((res) => res.ret_code);

  if (!normalRes || !normalRes.length) {
    return;
  }

  const retCodeMap = new Map<number, string>();
  callRes.forEach((res) => {
    if (retCodeMap.has(res.ret_code)) {
      retCodeMap.set(res.ret_code, `${retCodeMap.get(res.ret_code)}\n${res.message}`);
    } else {
      retCodeMap.set(res.ret_code, res.message);
    }
  });

  const resList = Array.from(retCodeMap).map(([ret_code, message]) => ({ ret_code, message }));

  resList.forEach((res) => {
    notify(res.message, {
      type: res.ret_code > 0 ? 'success' : 'error',
    });
  });
};

const notifyList = (list: { message: string; ret_code: number }[], options?: ToastOptions): void => {
  if (!list) {
    return;
  }
  for (const item of list) {
    notify(String(item.message), {
      type: item.ret_code > 0 ? 'success' : 'error',
    });
  }
};

export { notify, handleLinstorMessage, notifyList, handleAPICallRes };
