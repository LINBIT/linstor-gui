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
  callRes.forEach((res) => {
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
