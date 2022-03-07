import { toast, ToastOptions } from 'react-toastify';

const notify = (content: string, options?: ToastOptions): void => {
  if (!content) {
    return;
  }
  toast(content, {
    ...options,
  });
};

export default notify;
