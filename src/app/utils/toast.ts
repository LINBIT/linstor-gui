import { toast, ToastOptions } from 'react-toastify';

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

export { notify, handleLinstorMessage };
