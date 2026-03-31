// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { CONTROLLER_AUTH_TOKEN_STORAGE_KEY } from '@app/const/settings';

export const CONTROLLER_AUTH_REQUIRED_EVENT = 'linstor:controller-auth-required';

type ControllerAuthRequiredError = Error & {
  isControllerAuthRequired: true;
  status: 401;
};

const CONTROLLER_API_PREFIXES = ['/v1', '/v2'];
const EXCLUDED_API_PREFIXES = ['/api/v2/', '/api/frontend/v1'];

const hasWindow = () => typeof window !== 'undefined';

const getPathname = (url: string) => {
  try {
    return new URL(url, hasWindow() ? window.location.origin : 'http://localhost').pathname;
  } catch {
    return url;
  }
};

export const isControllerRequestUrl = (url?: string | URL | null) => {
  if (!url) {
    return false;
  }

  const rawUrl = typeof url === 'string' ? url : url.toString();
  const pathname = getPathname(rawUrl);

  if (EXCLUDED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }

  return CONTROLLER_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

export const getControllerAuthToken = () => {
  if (!hasWindow()) {
    return null;
  }

  return window.localStorage.getItem(CONTROLLER_AUTH_TOKEN_STORAGE_KEY);
};

export const setControllerAuthToken = (token: string) => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(CONTROLLER_AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearControllerAuthToken = () => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(CONTROLLER_AUTH_TOKEN_STORAGE_KEY);
};

export const getControllerAuthHeaderValue = () => {
  const token = getControllerAuthToken();

  return token ? `Bearer ${token}` : undefined;
};

export const withControllerAuthHeaders = (headersInit?: HeadersInit) => {
  const headers = new Headers(headersInit);
  const token = getControllerAuthHeaderValue();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', token);
  }

  return headers;
};

export const emitControllerAuthRequired = () => {
  if (!hasWindow()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(CONTROLLER_AUTH_REQUIRED_EVENT));
};

export const createControllerAuthRequiredError = (
  message = 'LINSTOR controller authentication is required.',
): ControllerAuthRequiredError => {
  const error = new Error(message) as ControllerAuthRequiredError;
  error.name = 'ControllerAuthRequiredError';
  error.isControllerAuthRequired = true;
  error.status = 401;

  return error;
};

export const isControllerAuthRequiredError = (error: unknown): error is ControllerAuthRequiredError => {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'isControllerAuthRequired' in error &&
      (error as ControllerAuthRequiredError).isControllerAuthRequired,
  );
};
