// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { components } from '@app/apis/schema';
import { message } from 'antd';
import i18n from 'i18next';

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
  switch (options?.type) {
    case 'success':
      message.success(content);
      break;
    case 'error':
      message.error(content);
      break;
    case 'warning':
      message.warning(content);
      break;
    case 'info':
      message.info(content);
      break;
  }
};

type APICALLRC = components['schemas']['ApiCallRc'];
type APICALLRCLIST = components['schemas']['ApiCallRcList'];

// Errors stay long enough to read, but no longer pin themselves to the screen.
const ERROR_TOAST_SECONDS = 10;

type RcEntry = { message: string; ret_code: number };

// ApiConsts: the low 15 bits of a ret_code are the outcome code.
const RC_CODE_BITS = 0x7fff;
const RC_CREATED = 1;
const RC_DELETED = 2;

// "(node-a) Resource 'r' [DRBD] adjusted." is a satellite reporting its part.
const fromSatellite = (e: RcEntry): boolean => /^\(\S+\) /.test(e.message);

// Success codes fit in 32 bits, so the bitwise mask reads them exactly.
const isCreatedOrDeleted = (e: RcEntry): boolean => {
  const code = e.ret_code & RC_CODE_BITS;
  return code === RC_CREATED || code === RC_DELETED;
};

/**
 * The entry that says what a successful reply did. Neither end of the list is
 * reliable: a snapshot reply ends with "Resumed IO ...", a file deploy is all
 * satellite echoes. The controller's own created/deleted entry is the
 * conclusion ("New snapshot ... registered.", "Resource definition ...
 * deleted."); without one, its last own entry; failing that, the last one.
 */
const successHeadline = (entries: RcEntry[]): RcEntry => {
  const own = entries.filter((e) => !fromSatellite(e));
  const outcome = [...own].reverse().find(isCreatedOrDeleted);
  return outcome ?? own[own.length - 1] ?? entries[entries.length - 1];
};

/**
 * One toast for one LINSTOR reply. A reply carries one ApiCallRc entry per
 * step (per node, per volume...), and toasting each of them buried the
 * outcome under a burst the user could not read; every entry still goes to
 * the log sidebar. Errors win: the first one is shown, the rest counted.
 * Otherwise the headline (see successHeadline) is shown.
 */
const toastSummary = (entries: RcEntry[], onClick?: () => void): void => {
  const relevant = entries.filter((e) => e.ret_code);
  if (!relevant.length) {
    return;
  }
  const errors = relevant.filter((e) => e.ret_code < 0);
  const shown = errors.length ? errors[0] : successHeadline(relevant);
  const rest = (errors.length || relevant.length) - 1;
  const content =
    rest > 0 ? `${shown.message} ${i18n.t('common:n_more_in_log', { count: rest })}` : String(shown.message);

  if (errors.length) {
    message.error({ content, duration: ERROR_TOAST_SECONDS, onClick: onClick ?? (() => message.destroy()) });
  } else {
    message.success({ content, onClick });
  }
};

// While > 0, replies are logged but not toasted: an action that makes several
// requests reports one outcome itself instead. See withQuietToasts.
let quietDepth = 0;

const toastsAreQuiet = (): boolean => quietDepth > 0;

/**
 * Runs an action whose requests should not toast on their own, because the
 * action shows its own summary (bulk delete, multi-step restore). The fetch
 * proxy checks this when a request is sent, so replies that are parsed after
 * the action finished are still kept quiet.
 */
const withQuietToasts = async <T>(action: () => Promise<T>): Promise<T> => {
  quietDepth += 1;
  try {
    return await action();
  } finally {
    quietDepth -= 1;
  }
};

interface LogItem {
  key: string;
  url: string;
  timestamp: number;
  result: APICALLRC;
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

  addBulkLogs(results: APICALLRCLIST, url: string, notify = true): void {
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
    if (notify) {
      this.handleAPICallRes(newLogs);
    }
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
    const keys = logs.map((log) => log.key);
    toastSummary(
      logs.map((log) => log.result),
      () => keys.forEach((key) => this.markAsRead(key)),
    );
  }
}

const logManager = ApiLogManager.getInstance();

const handleAPICallRes = (callRes: APICALLRCLIST, url: string, notify = true) => {
  if (!callRes || !callRes.length) {
    return;
  }

  const normalRes = callRes.filter((res) => res.ret_code);

  if (!normalRes || !normalRes.length) {
    return;
  }

  logManager.addBulkLogs(normalRes, url, notify);
};

const notifyMessages = (list: RcEntry[]): void => {
  if (!list) {
    return;
  }
  toastSummary(list);
};

export {
  notifyMessages,
  notify,
  handleLinstorMessage,
  handleAPICallRes,
  ApiLogManager,
  logManager,
  toastSummary,
  toastsAreQuiet,
  withQuietToasts,
};
export type { LogItem };
