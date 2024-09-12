const nodeListRes = [
  {
    name: 'node51',
    type: 'SATELLITE',
    props: { CurStltConnName: 'default', NodeUname: 'node51' },
    net_interfaces: [
      {
        name: 'default',
        address: '192.168.122.51',
        satellite_port: 3366,
        satellite_encryption_type: 'PLAIN',
        is_active: true,
        uuid: '04062818-aa04-4e10-8930-812d52d03f03',
      },
    ],
    connection_status: 'ONLINE',
    uuid: '84a5dbcd-a03d-4705-824d-498b55b546d5',
    storage_providers: ['DISKLESS', 'LVM', 'LVM_THIN', 'FILE', 'FILE_THIN', 'OPENFLEX_TARGET'],
    resource_layers: ['DRBD', 'WRITECACHE', 'CACHE', 'STORAGE'],
    unsupported_providers: {
      SPDK: [
        'IO exception occured when running \'rpc.py get_spdk_version\': Cannot run program "rpc.py": error=2, No such file or directory',
      ],
      ZFS_THIN: ["'cat /sys/module/zfs/version' returned with exit code 1"],
      ZFS: ["'cat /sys/module/zfs/version' returned with exit code 1"],
      EXOS: [
        "'/bin/bash -c cat /sys/class/sas_phy/*/sas_address' returned with exit code 1",
        "'/bin/bash -c cat /sys/class/sas_device/end_device-*/sas_address' returned with exit code 1",
      ],
    },
    unsupported_layers: {
      LUKS: [
        'IO exception occured when running \'cryptsetup --version\': Cannot run program "cryptsetup": error=2, No such file or directory',
      ],
      NVME: [
        'IO exception occured when running \'nvme version\': Cannot run program "nvme": error=2, No such file or directory',
      ],
      OPENFLEX: [
        'IO exception occured when running \'nvme version\': Cannot run program "nvme": error=2, No such file or directory',
      ],
      BCACHE: ["'modprobe bcache' returned with exit code 1"],
    },
  },
];

const NodeTypeData = {
  name: 'nodeA',
  type: 'SATELLITE',
  net_interfaces: [
    {
      name: 'default',
      address: '10.0.0.2',
      satellite_port: 3366,
      satellite_encryption_type: 'Plain',
      is_active: true,
    },
  ],
};

const interfaceData = [
  {
    name: 'default',
    address: '192.168.124.1',
    satellite_port: 3366,
    satellite_encryption_type: 'PLAIN',
    is_active: true,
    uuid: 'ec8669b1-dd09-4a18-82af-ace06c36a47d',
  },
];

export type NetInterfaceType = typeof interfaceData;
export type NodeInfoType = { node: string; ip: string; port: number | string };
export type NodeDTOType = typeof NodeTypeData;
export type TNodeListType = typeof nodeListRes;
