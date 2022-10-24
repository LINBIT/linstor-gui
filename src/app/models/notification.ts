import { createModel } from '@rematch/core';
import { RootModel } from '.';

import { ApiCallRcList, ApiCallRc } from '@app/interfaces/common';
import { uniqId } from '@app/utils/stringUtils';

type NotificationType = {
  toast: Array<{ title: string; variant: string; key: string }>;
};

export const notification = createModel<RootModel>()({
  state: { toast: [] } as NotificationType,
  reducers: {
    setNotificationList(state, payload: ApiCallRcList | ApiCallRc) {
      return {
        ...state,
        toast: Array.isArray(payload)
          ? payload.map((e) => ({
              title: e.message,
              variant: e.ret_code > 0 ? 'success' : 'danger',
              key: uniqId(),
            }))
          : [
              {
                title: payload.message,
                variant: payload.ret_code > 0 ? 'success' : 'danger',
                key: uniqId(),
              },
            ],
      };
    },
  },
});
