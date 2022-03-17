const item = {
  iqn: 'iqn.2019-08.com.linbit:example',
  resource_group: 'DfltRscGrp',
  volumes: [
    {
      number: 0,
      size_kib: 65536,
      file_system_root_owner: {
        Uid: 0,
        Gid: 0,
      },
    },
    {
      number: 1,
      size_kib: 2097152,
      file_system_root_owner: {
        Uid: 0,
        Gid: 0,
      },
    },
  ],
  service_ips: ['192.168.123.191/24'],
  status: {
    state: 'OK',
    service: 'Started',
    primary: 'Satellite04',
    nodes: ['Satellite03', 'Satellite04'],
    volumes: [
      {
        number: 0,
        state: 'OK',
      },
      {
        number: 1,
        state: 'OK',
      },
    ],
  },
};

export type ISCSI = typeof item;
