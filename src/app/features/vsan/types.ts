import { components } from '@app/apis/gatewayschema';

export type NFSResource = components['schemas']['NFSResourceConfig'];
export type ISCSIResource = components['schemas']['ISCSIResourceConfig'];
export type NVMEOFResource = components['schemas']['NvmeOfResourceConfig'];

export interface NetworkAddress {
  prefix: string;
  mask: number;
}

export interface VolumeStatus {
  number: number;
  state: string;
}

export interface NvmeStatus {
  state: string;
  service: string;
  nodes: string[];
  primary: string;
  volumes: VolumeStatus[];
}

export interface Volume {
  number: number;
  size_kib: number;
}

export interface NVMeTarget {
  nqn: string;
  service_ip: string;
  resource_group: string;
  volumes: Volume[];
  gross_size: boolean;
  status?: NvmeStatus;
}

export interface LUNStatus {
  number: number;
  state: string;
}

export interface ISCSIStatus {
  state: string;
  service: string;
  nodes: string[];
  primary: string;
  volumes: LUNStatus[];
}

export interface LUN {
  number: number;
  size_kib: number;
}

export interface ISCSITarget {
  iqn: string;
  allowed_initiators?: string[];
  resource_group: string;
  volumes: LUN[];
  service_ips: string[];
  username: string;
  password: string;
  gross_size: boolean;
  status?: ISCSIStatus;
  implementation: string;
}

export interface VolumeStatus {
  number: number;
  state: string;
}

export interface NfsStatus {
  state: string;
  service: string;
  nodes: string[];
  primary: string;
  volumes: VolumeStatus[];
}

export interface Volume {
  number: number;
  size_kib: number;
  file_system: string;
  export_path: string;
}

export interface NFSExport {
  name: string;
  service_ip: string;
  allowed_ips: string[];
  resource_group: string;
  volumes: Volume[];
  gross_size: boolean;
  status?: NfsStatus;
}

export interface VSANError {
  detail: string;
  message: string;
}
