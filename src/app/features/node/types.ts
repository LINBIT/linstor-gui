import { components, operations } from '@app/apis/schema';

export type NodeCreateRequestBody = components['schemas']['Node'];
export type NodeListQuery = operations['nodeList']['parameters']['query'];
export type NodeType = 'Controller' | 'Satellite' | 'Combined' | 'Auxiliary' | 'Openflex_Target';
export type NetInterfaceEncryptionType = 'PLAIN' | 'SSL' | undefined;
export type UpdateNetInterfaceRequestBody = components['schemas']['NetInterface'];
export type UpdateNodeRequestBody = components['schemas']['NodeModify'];
