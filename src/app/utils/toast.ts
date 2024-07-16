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

// [
//   {
//       "ret_code": 17825793,
//       "message": "Successfully set property 'DrbdOptions/auto-add-quorum-tiebreaker' to value 'true'",
//       "created_at": "2024-07-16T05:50:51.280032Z"
//   },
//   {
//       "ret_code": 4611686018461990912,
//       "message": "(satellite03) Controller properties applied",
//       "created_at": "2024-07-16T05:50:51.387375Z"
//   },
//   {
//       "ret_code": 4611686018461990912,
//       "message": "(satellite04) Controller properties applied",
//       "created_at": "2024-07-16T05:50:51.406219Z"
//   },
//   {
//       "ret_code": 4611686018461990912,
//       "message": "(satellite01) Controller properties applied",
//       "created_at": "2024-07-16T05:50:51.461567Z"
//   },
//   {
//       "ret_code": -4611686018392783898,
//       "message": "(Node: 'satellite02') Failed to create lvm volume",
//       "details": "Command 'lvcreate --config 'devices { filter=['\"'\"'a|/dev/sdb|'\"'\"','\"'\"'r|.*|'\"'\"'] }' --virtualsize 69632k linstor_MyThinVG --thinpool MyThinVG --name newNFS_00000 noew' returned with exitcode 3. \n\nStandard out: \n\n\nError message: \n  Command does not accept argument: noew.\n\n\nController",
//       "error_report_ids": [
//           "668273FA-AA8CD-000062",
//           "668D4531-00000-000000"
//       ],
//       "created_at": "2024-07-16T05:50:51.618018Z"
//   }
// ]

const handleAPICallRes = (callRes?: APICALLRCLIST) => {
  if (!callRes || !callRes.length) {
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
