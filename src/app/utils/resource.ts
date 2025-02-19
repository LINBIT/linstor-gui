interface Resource {
  name: string;
  node_name: string;
  flags: string[];
  volumes: Array<{
    flags: string[];
    state?: {
      disk_state?: string;
    };
  }>;
  layer_data: {
    layer_stack: string[];
    drbd_resource?: {
      connections: {
        [key: string]: {
          connected: boolean;
          message?: string;
        };
      };
    };
  };
  state?: {
    in_use?: boolean;
  };
}

interface ResourceState {
  node_name: string;
  name: string;
  in_use: boolean;
}

export function isFaultyResource(resource: Resource, resourceStates: ResourceState[]): boolean {
  const stateKey = resource.node_name + resource.name;
  const resourceState = resourceStates.find((state) => state.node_name + state.name === stateKey);

  const markedDelete = resource.flags.includes('DELETE') || resource.flags.includes('DRBD_DELETE');
  if (markedDelete) {
    return true;
  }

  if (resourceState) {
    if (resource.volumes) {
      for (const volume of resource.volumes) {
        const [state, hasError] = getVolumeState(volume, resource.flags);
        if (hasError) {
          return true;
        }
        if (resource.flags.includes('EVACUATE')) {
          return true;
        }
      }
    }
  }

  const skipDiskState = getSkipDiskState(resource);
  if (skipDiskState) {
    return true;
  }

  const connectionStatus = getConnectionStatus(resource);
  if (connectionStatus !== 'Ok' && connectionStatus !== '') {
    return true;
  }

  return false;
}

function getVolumeState(
  volume: { flags: string[]; state?: { disk_state?: string } },
  resourceFlags: string[],
): [string, boolean] {
  const diskState = volume.state?.disk_state || 'Unknown';
  const hasError = diskState !== 'UpToDate';
  return [diskState, hasError];
}

function getSkipDiskState(resource: Resource): string | null {
  const skipFlags: string[] = [];

  if (resource.flags.includes('SKIP_DISK')) {
    skipFlags.push('R');
  }

  if (resource.volumes?.some((v) => v.flags.includes('SKIP_DISK'))) {
    skipFlags.push('V');
  }

  if (skipFlags.length > 0) {
    return `, [SKIP_DISK: ${skipFlags.join(',')}]`;
  }

  return null;
}

function getConnectionStatus(resource: Resource): string {
  if (!resource.layer_data?.drbd_resource) {
    return 'Ok';
  }

  const failedConns: { [key: string]: string[] } = {};
  const connections = resource.layer_data.drbd_resource.connections;

  for (const [key, conn] of Object.entries(connections)) {
    if (!conn.connected) {
      const msg = conn.message || 'Unknown error';
      if (!failedConns[msg]) {
        failedConns[msg] = [];
      }
      failedConns[msg].push(key);
    }
  }

  if (Object.keys(failedConns).length === 0) {
    return 'Ok';
  }

  return Object.entries(failedConns)
    .map(([status, nodes]) => `${status}(${nodes.join(',')})`)
    .join(',');
}

export function getFaultyResources(resources: Resource[], resourceStates: ResourceState[]): Resource[] {
  return resources.filter((resource) => isFaultyResource(resource, resourceStates));
}
