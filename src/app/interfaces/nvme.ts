const item = {
  nqn: 'linbit:nvme:example4',
  service_ip: '192.168.211.122/24',
  resource_group: 'DfltRscGrp',
  volumes: [
    { number: 0, size_kib: 65536, file_system_root_owner: { Uid: 0, Gid: 0 } },
    { number: 1, size_kib: 1048576, file_system_root_owner: { Uid: 0, Gid: 0 } },
  ],
  status: {
    state: 'OK',
    service: 'Started',
    primary: 'Satellite04',
    nodes: ['Satellite03', 'Satellite04'],
    volumes: [
      { number: 0, state: 'OK' },
      { number: 1, state: 'OK' },
    ],
  },
};

export type NVME = typeof item & {
  deleting?: boolean;
  starting?: boolean;
  stopping?: boolean;
};
