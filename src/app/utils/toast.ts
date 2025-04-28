// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { components } from '@app/apis/schema';
import { message } from 'antd';

const handleLinstorMessage = (e: { message: string; ret_code: number }) => {
  return { title: e.message, type: e.ret_code > 0 ? 'success' : 'error' };
};

const notify = (
  content: string,
  options?: {
    type?: 'success' | 'error' | 'info' | 'warning' | undefined;
  },
): void => {
  if (!content) {
    return;
  }
  // toast(content, {
  //   ...options,
  // });
  if (options?.type === 'success') {
    message.success(content);
  } else if (options?.type === 'error') {
    message.error(content);
  }
};

type APICALLRC = components['schemas']['ApiCallRc'];
type APICALLRCLIST = components['schemas']['ApiCallRcList'];

interface LogItem {
  key: string;
  url: string;
  timestamp: number;
  result: APICALLRC & { created_at?: number };
  read: boolean;
}

class ApiLogManager {
  private static instance: ApiLogManager;
  private readonly storageKey: string = 'global_api_log';

  private constructor() {
    // Private constructor to prevent direct construction calls with the `new` operator.
  }

  public static getInstance(): ApiLogManager {
    if (!ApiLogManager.instance) {
      ApiLogManager.instance = new ApiLogManager();
    }
    return ApiLogManager.instance;
  }

  private getStoredLogs(): LogItem[] {
    const storedData = sessionStorage.getItem(this.storageKey);
    return storedData ? JSON.parse(storedData) : [];
  }

  private setStoredLogs(logs: LogItem[]): void {
    sessionStorage.setItem(this.storageKey, JSON.stringify(logs));

    const event = new CustomEvent('storageUpdate', {
      detail: { key: this.storageKey },
    });

    window.dispatchEvent(event);
  }

  private generateKey(url: string): string {
    return `${url}_${Date.now()}`;
  }

  addLog(result: APICALLRC, url: string): void {
    const timestamp = Date.now();
    const key = this.generateKey(url);
    const logs = this.getStoredLogs();
    const newLog: LogItem = {
      key,
      url,
      timestamp,
      result,
      read: false,
    };
    logs.push(newLog);
    this.setStoredLogs(logs);
    this.handleAPICallRes([newLog]);
  }

  addBulkLogs(results: APICALLRCLIST, url: string): void {
    const timestamp = Date.now();
    const logs = this.getStoredLogs();
    const newLogs: LogItem[] = results.map((result) => ({
      key: this.generateKey(url),
      url,
      timestamp,
      result,
      read: false,
    }));
    this.setStoredLogs([...logs, ...newLogs]);
    this.handleAPICallRes(newLogs);
  }

  public getLogs(url?: string): LogItem[] {
    const logs = this.getStoredLogs();
    return url ? logs.filter((log) => log.url === url) : logs;
  }

  clearLogs(url?: string): void {
    if (url) {
      const logs = this.getStoredLogs();
      const filteredLogs = logs.filter((log) => log.url !== url);
      this.setStoredLogs(filteredLogs);
    } else {
      sessionStorage.removeItem(this.storageKey);
    }
  }

  markAsRead(key: string): void {
    const logs = this.getStoredLogs();
    const updatedLogs = logs.map((log) => (log.key === key ? { ...log, read: true } : log));
    this.setStoredLogs(updatedLogs);
  }

  markAllAsRead(url?: string): void {
    const logs = this.getStoredLogs();
    const updatedLogs = logs.map((log) => ((url ? log.url === url : true) ? { ...log, read: true } : log));
    this.setStoredLogs(updatedLogs);
  }

  getSuccessLogs(url?: string): LogItem[] {
    const logs = this.getLogs(url);
    return logs.filter((log) => log.result.ret_code > 0);
  }

  getErrorLogs(url?: string): LogItem[] {
    const logs = this.getLogs(url);
    return logs.filter((log) => log.result.ret_code <= 0);
  }

  getUnreadLogs(url?: string): LogItem[] {
    const logs = this.getLogs(url);
    return logs.filter((log) => !log.read);
  }

  fullySuccess(res?: APICALLRCLIST): boolean {
    if (!res) {
      return false;
    }
    return res.every((item) => item.ret_code > 0);
  }

  partiallySuccess(res?: APICALLRCLIST): boolean {
    if (!res) {
      return false;
    }
    return res.some((item) => item.ret_code <= 0) && res.some((item) => item.ret_code > 0);
  }

  private handleAPICallRes(logs: LogItem[]): void {
    if (!logs || !logs.length) {
      return;
    }

    const normalLogs = logs.filter((log) => log.result.ret_code);

    if (!normalLogs || !normalLogs.length) {
      return;
    }

    this.notifyList(normalLogs);
  }

  private notifyList(logs: LogItem[]): void {
    if (!logs) {
      return;
    }
    for (const log of logs) {
      if (log.result.ret_code > 0) {
        message.success({
          content: String(log.result.message),
          onClick: () => {
            this.markAsRead(log.key);
          },
        });
      } else {
        message.error({
          content: String(log.result.message),
          duration: 0,
          onClick: () => {
            message.destroy();
          },
        });
      }
    }
  }
}

const logManager = ApiLogManager.getInstance();

const handleAPICallRes = (callRes: APICALLRCLIST, url: string) => {
  if (!callRes || !callRes.length) {
    return;
  }

  const normalRes = callRes.filter((res) => res.ret_code);

  if (!normalRes || !normalRes.length) {
    return;
  }

  logManager.addBulkLogs(normalRes, url);
};

const notifyMessages = (list: { message: string; ret_code: number }[]): void => {
  if (!list) {
    return;
  }
  const hasError = list.some((e) => e.ret_code < 0);
  if (hasError) {
    const errorMessages = list.filter((e) => e.ret_code < 0);

    for (const item of errorMessages) {
      message.error(String(item.message));
    }
  } else {
    for (const item of list) {
      message.success(String(item.message));
    }
  }
};

export { notifyMessages, notify, handleLinstorMessage, handleAPICallRes, ApiLogManager, logManager };
export type { LogItem };
