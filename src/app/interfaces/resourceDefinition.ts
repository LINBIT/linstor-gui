const listResData = [
  {
    name: 'rsc1',
    external_name: 'string',
    props: {
      additionalProp1: 'string',
      additionalProp2: 'string',
      additionalProp3: 'string',
    },
    flags: ['string'],
    layer_data: [
      {
        type: 'DRBD',
        data: {
          resource_name_suffix: 'string',
          peer_slots: 0,
          al_stripes: 0,
          al_stripe_size_kib: 0,
          port: 7000,
          transport_type: 'string',
          secret: '7sqCWjvGmwAiV5kzg3VF',
          down: true,
        },
      },
    ],
    uuid: 'e8ef8d6b-17bc-42f0-9367-4aae40c78ecb',
    resource_group_name: 'string',
    volume_definitions: [
      {
        volume_number: 0,
        size_kib: 0,
        props: {
          additionalProp1: 'string',
          additionalProp2: 'string',
          additionalProp3: 'string',
        },
        flags: ['string'],
        layer_data: [
          {
            type: 'DRBD',
            data: {
              resource_name_suffix: 'string',
              volume_number: 0,
              minor_number: 0,
            },
          },
        ],
        uuid: 'e8ef8d6b-17bc-42f0-9367-4aae40c78ecb',
      },
    ],
  },
];

export type TRDList = typeof listResData;
