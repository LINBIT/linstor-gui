import service from '@app/requests';
import {
  NodeListStatsResponse,
  NodeLitResponse,
  NodeListRequest,
  NodeLostRequest,
  NodeModifyRequest,
} from '@app/interfaces/node';
import { ApiCallRcList } from '@app/interfaces/common';

type OperationResponseList = Promise<{
  data: ApiCallRcList;
}>;

const fetchNodeStats = (): Promise<{ data: NodeListStatsResponse }> =>
  service.get<unknown, { data: NodeListStatsResponse }>('/v1/stats/nodes');

const fetchNodeList = (req: NodeListRequest): Promise<{ data: NodeLitResponse }> => {
  return service.get<NodeListRequest, { data: NodeLitResponse }>('/v1/nodes', {
    params: {
      ...req,
      nodes: req.nodes?.join(',') || undefined,
    },
  });
};

const lostNodeRequest = ({ node }: NodeLostRequest): OperationResponseList => {
  return service.delete<unknown, { data: ApiCallRcList }>(`/v1/nodes/${node}/lost`);
};

const deleteNodeRequest = ({ node }: NodeLostRequest): OperationResponseList => {
  return service.delete<unknown, { data: ApiCallRcList }>(`/v1/nodes/${node}`);
};

const updateNodeRequest = (node: string, data: NodeModifyRequest): OperationResponseList => {
  return service.put<unknown, { data: ApiCallRcList }>(`/v1/nodes/${node}`, data);
};

export { fetchNodeList, fetchNodeStats, lostNodeRequest, deleteNodeRequest, updateNodeRequest };
