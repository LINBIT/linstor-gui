interface Connection {
  connected: boolean;
  message?: string;
}

interface Volume {
  volume_number?: number;
  flags?: string[];
  state?: {
    disk_state?: string;
  };
  data_v1?: {
    layer_data_list?: Array<{
      type: string;
    }>;
    state?: {
      disk_state?: string;
    };
  };
  layer_data_list?: Array<{
    type: string;
    data?: unknown;
  }>;
  reports?: Array<{
    is_error: () => boolean;
  }>;
}

export interface Resource {
  name: string;
  node_name: string;
  flags: string[];
  volumes?: Volume[];
  layer_data?: {
    drbd_resource?: {
      connections?: Record<string, Connection>;
    };
  };
  layer_object?: {
    type: string;
    drbd?: {
      connections?: Record<string, Connection>;
    };
  };
}

export function isFaultyResource(resource: Resource): boolean {
  // Check if resource is marked for deletion
  if (resource?.flags?.includes('DELETE') || resource?.flags?.includes('DRBD_DELETE')) {
    return true;
  }

  // Check if resource is inactive
  if (resource?.flags?.includes('RSC_INACTIVE')) {
    return true;
  }

  // Check for bad volume states
  let hasBadVolumeState = false;
  if (resource?.volumes) {
    for (const volume of resource.volumes) {
      const [_, isBad] = getVolumeState(volume, resource?.flags ?? []);
      if (isBad) {
        hasBadVolumeState = true;
        break;
      }

      if (volume?.reports?.some((report) => report.is_error())) {
        hasBadVolumeState = true;
        break;
      }
    }
  }

  if (hasBadVolumeState) {
    return true;
  }

  // Check for skip disk state flags
  const skipDiskState = getSkipDiskState(resource);
  if (skipDiskState) {
    return true;
  }

  // Check DRBD connections from either layer_data or layer_object
  const drbdConnections = resource?.layer_data?.drbd_resource?.connections || resource?.layer_object?.drbd?.connections;

  if (drbdConnections) {
    for (const conn of Object.values(drbdConnections)) {
      if (!conn.connected) {
        return true;
      }
    }
  }

  // Check overall resource state
  const state = getResourceState(resource);
  if (state === 'Unknown') {
    return true;
  }

  return false;
}

export function getResourceState(resource: Resource, targetVolumeNumber?: number): string {
  // Check deletion flags
  if (resource?.flags?.includes('DELETE') || resource?.flags?.includes('DRBD_DELETE')) {
    return 'DELETING';
  }

  // Check inactive flag
  if (resource?.flags?.includes('RSC_INACTIVE')) {
    return 'RSC_INACTIVE';
  }

  // Get state from volumes
  if (resource?.volumes && resource.volumes.length > 0) {
    const states: string[] = [];
    const badStates: string[] = [];

    for (const volume of resource.volumes) {
      if (typeof targetVolumeNumber !== 'undefined' && volume.volume_number !== targetVolumeNumber) {
        continue;
      }

      const volumeStateResult = getVolumeState(volume, resource?.flags ?? []);
      let state = volumeStateResult[0];
      const isBad = volumeStateResult[1];
      if (resource?.flags?.includes('EVACUATE')) {
        state += ', Evacuating';
      }

      if (state !== 'Unknown') {
        if (typeof targetVolumeNumber !== 'undefined') {
          return state;
        }
        states.push(state);
        if (isBad) {
          badStates.push(state);
        }
      }
    }

    if (states.length > 0) {
      if (badStates.length > 0) {
        return Array.from(new Set(badStates)).join(', ');
      }
      return Array.from(new Set(states)).join(', ');
    }
  }

  return 'Unknown';
}

function getSkipDiskState(resource: Resource): string | null {
  const skipFlags: string[] = [];

  // Check resource level skip disk flag
  if (resource?.flags?.includes('SKIP_DISK')) {
    skipFlags.push('R');
  }

  // Check volume level skip disk flags
  if (resource?.volumes?.some((volume) => volume.flags?.includes('SKIP_DISK'))) {
    skipFlags.push('V');
  }

  if (skipFlags.length > 0) {
    return `, [SKIP_DISK: ${skipFlags.join(',')}]`;
  }

  return null;
}

export function getVolumeState(volume: Volume, resourceFlags: string[]): [string, boolean] {
  // Check if volume is being resized
  const resizing = volume?.flags?.includes('RESIZE');
  const statePrefix = resizing ? 'Resizing, ' : '';

  // Check if this is a DRBD volume
  const expectDiskState =
    volume?.data_v1?.layer_data_list?.[0]?.type === 'DRBD' ||
    volume?.layer_data_list?.some((layer) => layer.type === 'DRBD');

  if (!expectDiskState) {
    return [statePrefix + 'Created', false];
  }

  // Get disk state from available paths
  const diskState = volume?.data_v1?.state?.disk_state || volume?.state?.disk_state;

  if (!diskState) {
    return [statePrefix + 'Unknown', true];
  }

  if (diskState === 'DUnknown') {
    return [statePrefix + 'Unknown', true];
  }

  // Handle diskless state
  if (diskState === 'Diskless') {
    if (!resourceFlags.includes('DISKLESS')) {
      return [statePrefix + diskState, true];
    }
    if (resourceFlags.includes('TIE_BREAKER')) {
      return ['TieBreaker', false];
    }
    return [statePrefix + diskState, false];
  }

  // Handle problematic states
  if (['Inconsistent', 'Failed', 'To: Creating', 'To: Attachable', 'To: Attaching'].includes(diskState)) {
    return [statePrefix + diskState, true];
  }

  // Handle healthy states
  if (['UpToDate', 'Created', 'Attached'].includes(diskState)) {
    return [statePrefix + diskState, false];
  }

  // Default for any other state
  return [statePrefix + diskState, true];
}

export function getFaultyResources(resources: Resource[]): Resource[] {
  return resources.filter(isFaultyResource);
}

export function getFaultyVolumeNumbers(resource: Resource): number[] {
  const faultyVolumeNumbers: number[] = [];
  if (resource?.volumes) {
    for (const volume of resource.volumes) {
      const [_, isBad] = getVolumeState(volume, resource?.flags ?? []);
      if (isBad && typeof volume.volume_number === 'number') {
        faultyVolumeNumbers.push(volume.volume_number);
      }
    }
  }
  return faultyVolumeNumbers;
}
