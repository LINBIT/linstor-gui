// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

const listResData = [
  {
    name: 'rsc1',
    node_name: 'nodeA',
    props: {
      additionalProp1: 'string',
      additionalProp2: 'string',
      additionalProp3: 'string',
    },
    flags: ['string'],
    layer_object: {
      children: ['string'],
      resource_name_suffix: 'string',
      type: 'DRBD',
      drbd: {
        drbd_resource_definition: {
          resource_name_suffix: 'string',
          peer_slots: 0,
          al_stripes: 0,
          al_stripe_size_kib: 0,
          port: 7000,
          transport_type: 'string',
          secret: '7sqCWjvGmwAiV5kzg3VF',
          down: true,
        },
        node_id: 0,
        peer_slots: 0,
        al_stripes: 0,
        al_size: 0,
        flags: ['string'],
        drbd_volumes: [
          {
            drbd_volume_definition: {
              resource_name_suffix: 'string',
              volume_number: 0,
              minor_number: 0,
            },
            device_path: 'string',
            backing_device: 'string',
            meta_disk: 'string',
            allocated_size_kib: 0,
            usable_size_kib: 0,
            disk_state: 'string',
            ext_meta_stor_pool: 'string',
          },
        ],
        connections: {
          additionalProp1: {
            connected: true,
            message: 'Connected',
          },
          additionalProp2: {
            connected: true,
            message: 'Connected',
          },
          additionalProp3: {
            connected: true,
            message: 'Connected',
          },
        },
        promotion_score: 0,
        may_promote: true,
      },
      luks: {
        luks_volumes: [
          {
            volume_number: 0,
            device_path: 'string',
            backing_device: 'string',
            allocated_size_kib: 0,
            usable_size_kib: 0,
            disk_state: 'string',
            opened: true,
          },
        ],
      },
      storage: {
        storage_volumes: [
          {
            volume_number: 0,
            device_path: 'string',
            allocated_size_kib: 0,
            usable_size_kib: 0,
            disk_state: 'string',
          },
        ],
      },
      nvme: {
        nvme_volumes: [
          {
            volume_number: 0,
            device_path: 'string',
            backing_device: 'string',
            allocated_size_kib: 0,
            usable_size_kib: 0,
            disk_state: 'string',
          },
        ],
      },
      openflex: {
        openflex_resource_definition: {
          resource_name_suffix: 'string',
          nqn: 'string',
        },
        openflex_volumes: [
          {
            volume_number: 0,
            device_path: 'string',
            allocated_size_kib: 0,
            usable_size_kib: 0,
            disk_state: 'string',
          },
        ],
      },
      writecache: {
        writecache_volumes: [
          {
            volume_number: 0,
            device_path: 'string',
            device_path_cache: 'string',
            allocated_size_kib: 0,
            usable_size_kib: 0,
            disk_state: 'string',
          },
        ],
      },
      cache: {
        cache_volumes: [
          {
            volume_number: 0,
            device_path: 'string',
            device_path_cache: 'string',
            device_meta_cache: 'string',
            allocated_size_kib: 0,
            usable_size_kib: 0,
            disk_state: 'string',
          },
        ],
      },
      bcache: {
        bcache_volumes: [
          {
            volume_number: 0,
            device_path: 'string',
            device_path_cache: 'string',
            allocated_size_kib: 0,
            usable_size_kib: 0,
            disk_state: 'string',
          },
        ],
      },
    },
    state: {
      in_use: true,
    },
    uuid: 'e8ef8d6b-17bc-42f0-9367-4aae40c78ecb',
    create_timestamp: 0,
    volumes: [
      {
        volume_number: 0,
        storage_pool_name: 'string',
        provider_kind: 'DISKLESS',
        device_path: 'string',
        allocated_size_kib: 0,
        usable_size_kib: 0,
        props: {
          additionalProp1: 'string',
          additionalProp2: 'string',
          additionalProp3: 'string',
        },
        flags: ['string'],
        state: {
          disk_state: 'string',
        },
        layer_data_list: [
          {
            type: 'DRBD',
            data: {
              drbd_volume_definition: {
                resource_name_suffix: 'string',
                volume_number: 0,
                minor_number: 0,
              },
              device_path: 'string',
              backing_device: 'string',
              meta_disk: 'string',
              allocated_size_kib: 0,
              usable_size_kib: 0,
              disk_state: 'string',
              ext_meta_stor_pool: 'string',
            },
          },
        ],
        uuid: 'e8ef8d6b-17bc-42f0-9367-4aae40c78ecb',
        reports: [
          {
            ret_code: 0,
            message: 'Operation result.',
            cause: 'string',
            details: 'string',
            correction: 'string',
            error_report_ids: ['string'],
            obj_refs: {
              additionalProp1: 'string',
              additionalProp2: 'string',
              additionalProp3: 'string',
            },
          },
        ],
      },
    ],
    shared_name: 'string',
  },
];

const volumes = [
  {
    volume_number: 0,
    storage_pool_name: 'string',
    provider_kind: 'DISKLESS',
    device_path: 'string',
    allocated_size_kib: 0,
    usable_size_kib: 0,
    props: {
      additionalProp1: 'string',
      additionalProp2: 'string',
      additionalProp3: 'string',
    },
    flags: ['string'],
    state: {
      disk_state: 'string',
    },
    layer_data_list: [
      {
        type: 'DRBD',
        data: {
          drbd_volume_definition: {
            resource_name_suffix: 'string',
            volume_number: 0,
            minor_number: 0,
          },
          device_path: 'string',
          backing_device: 'string',
          meta_disk: 'string',
          allocated_size_kib: 0,
          usable_size_kib: 0,
          disk_state: 'string',
          ext_meta_stor_pool: 'string',
        },
      },
    ],
    uuid: 'e8ef8d6b-17bc-42f0-9367-4aae40c78ecb',
    reports: [
      {
        ret_code: 0,
        message: 'Operation result.',
        cause: 'string',
        details: 'string',
        correction: 'string',
        error_report_ids: ['string'],
        obj_refs: {
          additionalProp1: 'string',
          additionalProp2: 'string',
          additionalProp3: 'string',
        },
      },
    ],
  },
];

export type ResourceListType = typeof listResData;

export type VolumeType = typeof volumes[0];
