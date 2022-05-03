const item = {
  name: 'example2',
  service_ip: '192.168.211.122/24',
  allowed_ips: ['0.0.0.0/0'],
  resource_group: 'DfltRscGrp',
  volumes: [
    {
      number: 0,
      size_kib: 65536,
      file_system: '-E root_owner=0:0',
      file_system_root_owner: { Uid: 0, Gid: 0 },
      export_path: '',
    },
    {
      number: 1,
      size_kib: 2097152,
      file_system: '-E root_owner=65534:65534',
      file_system_root_owner: { Uid: 0, Gid: 0 },
      export_path: '/',
    },
  ],
  status: {
    state: 'OK',
    service: 'Started',
    primary: 'Satellite01',
    nodes: ['Satellite01', 'Satellite02'],
    volumes: [
      { number: 0, state: 'OK' },
      { number: 1, state: 'OK' },
    ],
  },
};

export type NFS = typeof item & {
  deleting?: boolean;
  starting?: boolean;
  stopping?: boolean;
};
