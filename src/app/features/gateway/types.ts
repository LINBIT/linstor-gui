import { components } from '@app/apis/gatewayschema';

export type NFSResource = components['schemas']['NFSResourceConfig'];
export type ISCSIResource = components['schemas']['ISCSIResourceConfig'];
export type NVMEOFResource = components['schemas']['NvmeOfResourceConfig'];

export interface NetworkAddress {
  prefix: string;
  mask: number;
}
