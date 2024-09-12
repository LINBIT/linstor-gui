import React, { FunctionComponent, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';
import NodeIpAddressForm from './components/NodeIpAddressForm';
import service from '@app/requests';

const IpAddressEdit: FunctionComponent = () => {
  const [alertList, setAlertList] = useState<alertList>([]);
  const { node, ip } = useParams() as { node: string; ip: string };

  const { data, loading, error } = useRequest(
    () => ({
      url: `/v1/nodes?nodes=${node}`,
    }),
    {
      requestMethod: (params) => service.get(params.url),
    }
  );

  const { run: editIpAddress } = useRequest(
    (body) => ({
      url: `/v1/nodes/${node}/net-interfaces/${ip}`,
      body,
    }),
    {
      manual: true,
      requestMethod: (param) => {
        return service
          .put(param.url, param.body)
          .then((res) => {
            if (res) {
              setAlertList(
                res.data.map((e) => ({
                  variant: e.ret_code > 0 ? 'success' : 'danger',
                  key: (e.ret_code + new Date()).toString(),
                  title: e.message,
                }))
              );
            }
          })
          .catch((errorArray) => {
            if (errorArray) {
              setAlertList(
                errorArray.map((e) => ({
                  variant: e.ret_code > 0 ? 'success' : 'danger',
                  key: (e.ret_code + new Date()).toString(),
                  title: e.message,
                }))
              );
            }
          });
      },
    }
  );

  const handleEditNode = async (node: string, data) => {
    // {"name":"name2","address":"192.168.1.111","satellite_port":"3367","satellite_encryption_type":"PLAIN","is_active":true}
    console.log(data, 'data');
    await editIpAddress(data);
  };

  /**
   * Add a empty state
   */
  const emptyState = useMemo(() => {
    return Array.isArray(data) && data.length === 0;
  }, [data]);

  const initialVal = useMemo(() => {
    if (!loading && Array.isArray(data.data) && data.data.length > 0) {
      const netInfo = data.data[0]?.net_interfaces.find((e) => e.name === ip);
      const { name, address, satellite_port, is_active } = netInfo;
      return {
        name,
        address,
        satellite_port,
        is_active,
        node,
      };
    } else {
      return undefined;
    }
  }, [data?.data, ip, loading, node]);

  return (
    <PageBasic title="Edit Ip Address" loading={loading} error={error || emptyState} alerts={alertList}>
      <NodeIpAddressForm initialVal={initialVal} handleSubmit={handleEditNode} editing={true} />
    </PageBasic>
  );
};

export default IpAddressEdit;
