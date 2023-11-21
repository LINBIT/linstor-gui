import createClient from 'openapi-fetch';
import { paths } from '@app/apis/schema';
import { handleAPICallRes } from '@app/utils/toast';
import { components } from '@app/apis/schema';

type APICALLRC = components['schemas']['ApiCallRc'];
type APICALLRCLIST = components['schemas']['ApiCallRcList'];

window.fetch = new Proxy(window.fetch, {
  apply: function (target, that, args) {
    // args holds argument of fetch function
    const temp = target.apply(that, args);
    temp.then((res) => {
      if (res.ok) {
        try {
          res
            .clone()
            .json()
            .then((data) => {
              // add a rule for not calling handleAPICallRes when url includes some strings
              const excludeList = ['key-value-store', 'snapshots'];

              if (!excludeList.some((item) => res.url?.includes(item))) {
                handleAPICallRes(data);
              }
            });
        } catch (error) {
          return res;
        }

        return res;
      }
      // After completion of request
      if (res.status === 400 || res.status === 500) {
        try {
          res
            .clone()
            .json()
            .then((err) => {
              // handle error, notice that res.json() returns a promise
              handleAPICallRes(err);
            });
        } catch (error) {
          return res;
        }

        return res;
      }
    });

    return temp;
  },
});

const fullySuccess = (res?: APICALLRCLIST) => {
  if (!res) {
    return false;
  }
  return res.every((item) => item.ret_code > 0);
};

const partiallySuccess = (res?: APICALLRCLIST) => {
  if (!res) {
    return false;
  }
  return res.some((item) => item.ret_code < 0) && res.some((item) => item.ret_code > 0);
};

const { get, post, del, put, patch, head, trace, options } = createClient<paths>({ baseUrl: '', fetch: window.fetch });

export { get, post, del, put, patch, head, trace, options, fullySuccess, partiallySuccess };
export type { APICALLRC, APICALLRCLIST };
