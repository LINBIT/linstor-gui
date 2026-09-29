// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

import { withQuietToasts } from '@app/utils/toast';
import { replyError } from '@app/features/requests/reply';

// The reply check moved next to the API client; existing imports keep working.
export { replyError };

const ERROR_TOAST_SECONDS = 10;
const DEFAULT_CONCURRENCY = 4;

/** Table rowClassName for a row whose delete is in flight. */
export const deletingRowClass = 'opacity-50 pointer-events-none transition-opacity';

export interface DeleteActionOptions<T> {
  /** One delete; resolves with the API reply (see replyError) or throws. */
  remove: (item: T) => Promise<unknown>;
  /** Row key, for the in-flight state. */
  keyOf: (item: T) => string;
  /** Human name, for the summary toast. */
  nameOf: (item: T) => string;
  /** Reloads the list once all deletes finished; awaited so a row never flashes back. */
  refresh?: () => unknown;
  concurrency?: number;
  /**
   * The reply does not pass the fetch proxy (axios calls), so nothing toasts a
   * single delete unless this hook does.
   */
  toastSingle?: boolean;
}

export interface DeleteActionResult<T> {
  done: T[];
  failed: { item: T; error: string }[];
}

/**
 * One delete flow for every list: rows show a deleting state while their
 * request is in flight, a failure is reported as a failure (never followed by
 * "deleted"), and a bulk delete runs with limited concurrency, keeps the
 * per-reply toasts quiet and reports one summary. `run` resolves after the
 * refresh, so a Popconfirm that awaits it keeps its spinner until the row is
 * gone.
 */
export function useDeleteAction<T>(options: DeleteActionOptions<T>) {
  const { t } = useTranslation(['common']);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  const run = async (items: T[]): Promise<DeleteActionResult<T>> => {
    const { remove, keyOf, nameOf, refresh, concurrency = DEFAULT_CONCURRENCY, toastSingle = false } = options;
    const result: DeleteActionResult<T> = { done: [], failed: [] };
    if (!items.length) {
      return result;
    }

    const keys = items.map(keyOf);
    setPending((prev) => new Set([...prev, ...keys]));
    const bulk = items.length > 1;
    let threw = false;

    const deleteOne = async (item: T) => {
      try {
        const error = replyError(await remove(item));
        if (error) {
          result.failed.push({ item, error });
        } else {
          result.done.push(item);
        }
      } catch (e) {
        threw = true;
        // axios rejects with the response body ({ message } or an ApiCallRc
        // list), not an Error.
        result.failed.push({ item, error: e instanceof Error ? e.message : (replyError({ error: e }) ?? String(e)) });
      }
    };

    const deleteAll = async () => {
      let next = 0;
      const lane = async () => {
        while (next < items.length) {
          await deleteOne(items[next++]);
        }
      };
      await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
    };

    try {
      await (bulk ? withQuietToasts(deleteAll) : deleteAll());
      await refresh?.();
    } finally {
      setPending((prev) => {
        const nextPending = new Set(prev);
        keys.forEach((key) => nextPending.delete(key));
        return nextPending;
      });
    }

    const [firstFailure] = result.failed;
    if (bulk) {
      if (firstFailure) {
        message.error({
          content: t('common:bulk_delete_failed', {
            done: result.done.length,
            total: items.length,
            name: nameOf(firstFailure.item),
            error: firstFailure.error,
          }),
          duration: ERROR_TOAST_SECONDS,
        });
      } else {
        message.success(t('common:bulk_delete_done', { done: result.done.length, total: items.length }));
      }
    } else if (firstFailure && (toastSingle || threw)) {
      // Otherwise the fetch proxy already toasted the reply's error.
      message.error({
        content: t('common:delete_failed', { name: nameOf(firstFailure.item), error: firstFailure.error }),
        duration: ERROR_TOAST_SECONDS,
      });
    } else if (!firstFailure && toastSingle) {
      message.success(t('common:deleted_name', { name: nameOf(items[0]) }));
    }

    return result;
  };

  return {
    run,
    isDeleting: (key: string) => pending.has(key),
    busy: pending.size > 0,
  };
}
