const listRes = [
  {
    name: 'string',
    resource_name: 'string',
    nodes: ['string'],
    props: {
      additionalProp1: 'string',
      additionalProp2: 'string',
      additionalProp3: 'string',
    },
    flags: ['string'],
    volume_definitions: [
      {
        volume_number: 0,
        size_kib: 0,
      },
    ],
    uuid: 'e8ef8d6b-17bc-42f0-9367-4aae40c78ecb',
    snapshots: [
      {
        snapshot_name: 'string',
        node_name: 'string',
        create_timestamp: 0,
        flags: ['string'],
        uuid: 'e8ef8d6b-17bc-42f0-9367-4aae40c78ecb',
      },
    ],
  },
];

export type SnapshotList = typeof listRes;

export type SnapshotType = typeof listRes[0];
