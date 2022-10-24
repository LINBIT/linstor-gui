import service from '@app/requests';
import { NodeListStatsResponse, NodeLitResponse, NodeListRequest, NodeLostRequest } from '@app/interfaces/node';
import { ApiCallRc, ApiCallRcList } from '@app/interfaces/common';

const fetchNodeStats = () => service.get<unknown, { data: NodeListStatsResponse }>('/v1/stats/nodes');

const fetchNodeList = (req: NodeListRequest) =>
  service.get<NodeListRequest, { data: NodeLitResponse }>('/v1/nodes', {
    params: {
      ...req,
    },
  });

const lostNodeRequest = ({ node }: NodeLostRequest) => {
  return service.delete<unknown, { data: ApiCallRcList }>(`/v1/nodes/${node}/lost`);
};

const deleteNodeRequest = ({ node }: NodeLostRequest) => {
  return service.delete<unknown, { data: ApiCallRcList }>(`/v1/nodes/${node}`);
};

export { fetchNodeList, fetchNodeStats, lostNodeRequest, deleteNodeRequest };
