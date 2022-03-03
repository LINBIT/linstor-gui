import { createModel } from '@rematch/core';
import { RootModel } from '.';

import { AlertType } from '@app/interfaces/alert';
import { uniqId } from '@app/utils/stringUtils';

type NotificationType = {
  toast: Array<{ title: string; variant: string; key: string }>;
};

export const notification = createModel<RootModel>()({
  state: { toast: [] } as NotificationType,
  reducers: {
    setNotificationList(state, payload: AlertType[]) {
      return {
        ...state,
        toast: payload.map((e) => ({
          title: e.message,
          variant: e.ret_code > 0 ? 'success' : 'danger',
          key: uniqId(),
        })),
      };
    },
  },
});
