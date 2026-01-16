// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

export const propertyConstants = {
  data: [
    {
      blockcomment:
        'Bits 62 - 63 (most significant 2) are reserved for the message type masks (error, warning, info)\nBits 25 - 26 are reserved for the operation type masks (create, modify, delete)\nBits 18 - 22 are reserved for the object type masks (node, resource, resource definition, ...)\nBits 0  - 14 are reserved for codes',
    },
    {
      name: 'MASK_BITS_TYPE',
      value: '0xC000000000000000L',
      type: 'long',
    },
    {
      name: 'MASK_ERROR',
      value: '0xC000000000000000L',
      type: 'long',
    },
    {
      name: 'MASK_WARN',
      value: '0x8000000000000000L',
      type: 'long',
    },
    {
      name: 'MASK_INFO',
      value: '0x4000000000000000L',
      type: 'long',
    },
    {
      name: 'MASK_SUCCESS',
      value: '0x0000000000000000L',
      type: 'long',
    },
    {
      blockcomment: 'Operation type masks',
    },
    {
      name: 'MASK_BITS_OP',
      value: '0x0000000003000000L',
      type: 'long',
    },
    {
      name: 'MASK_CRT',
      value: '0x0000000001000000L',
      type: 'long',
    },
    {
      name: 'MASK_MOD',
      value: '0x0000000002000000L',
      type: 'long',
    },
    {
      name: 'MASK_DEL',
      value: '0x0000000003000000L',
      type: 'long',
    },
    {
      blockcomment: 'Type masks (Node, ResDfn, Res, VolDfn, Vol, NetInterface, ...)',
    },
    {
      name: 'MASK_BITS_OBJ',
      value: '0x00000000007C0000L',
      type: 'long',
    },
    {
      name: 'MASK_SCHEDULE',
      value: '0x0000000000540000L',
      type: 'long',
    },
    {
      name: 'MASK_EXT_FILES',
      value: '0x0000000000500000L',
      type: 'long',
    },
    {
      name: 'MASK_PHYSICAL_DEVICE',
      value: '0x00000000004C0000L',
      type: 'long',
    },
    {
      name: 'MASK_VLM_GRP',
      value: '0x0000000000480000L',
      type: 'long',
    },
    {
      name: 'MASK_RSC_GRP',
      value: '0x0000000000440000L',
      type: 'long',
    },
    {
      name: 'MASK_KVS',
      value: '0x0000000000400000L',
      type: 'long',
    },
    {
      name: 'MASK_NODE',
      value: '0x00000000003C0000L',
      type: 'long',
    },
    {
      name: 'MASK_RSC_DFN',
      value: '0x0000000000380000L',
      type: 'long',
    },
    {
      name: 'MASK_RSC',
      value: '0x0000000000340000L',
      type: 'long',
    },
    {
      name: 'MASK_VLM_DFN',
      value: '0x0000000000300000L',
      type: 'long',
    },
    {
      name: 'MASK_VLM',
      value: '0x00000000002C0000L',
      type: 'long',
    },
    {
      name: 'MASK_NODE_CONN',
      value: '0x0000000000280000L',
      type: 'long',
    },
    {
      name: 'MASK_RSC_CONN',
      value: '0x0000000000240000L',
      type: 'long',
    },
    {
      name: 'MASK_VLM_CONN',
      value: '0x0000000000200000L',
      type: 'long',
    },
    {
      name: 'MASK_NET_IF',
      value: '0x00000000001C0000L',
      type: 'long',
    },
    {
      name: 'MASK_STOR_POOL_DFN',
      value: '0x0000000000180000L',
      type: 'long',
    },
    {
      name: 'MASK_STOR_POOL',
      value: '0x0000000000140000L',
      type: 'long',
    },
    {
      name: 'MASK_CTRL_CONF',
      value: '0x0000000000100000L',
      type: 'long',
    },
    {
      name: 'MASK_SNAPSHOT',
      value: '0x00000000000C0000L',
      type: 'long',
    },
    {
      name: 'MASK_BACKUP',
      value: '0x0000000000080000L',
      type: 'long',
    },
    {
      name: 'MASK_REMOTE',
      value: '0x0000000000040000L',
      type: 'long',
    },
    {
      blockcomment: 'Codes',
    },
    {
      name: 'MASK_BITS_CODE',
      value: '0x0000000000007FFFL',
      type: 'long',
    },
    {
      blockcomment: 'Codes 1-9: success',
    },
    {
      name: 'CREATED',
      value: [1, 'MASK_SUCCESS'],
      type: 'BOR',
    },
    {
      name: 'DELETED',
      value: [2, 'MASK_SUCCESS'],
      type: 'BOR',
    },
    {
      name: 'MODIFIED',
      value: [3, 'MASK_SUCCESS'],
      type: 'BOR',
    },
    {
      name: 'PASSPHRASE_ACCEPTED',
      value: [4, 'MASK_SUCCESS'],
      type: 'BOR',
    },
    {
      blockcomment: 'Codes 100 - 999: failures',
    },
    {
      blockcomment: 'Codes 100 - 199: sql failures',
    },
    {
      name: 'FAIL_SQL',
      value: [100, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_SQL_ROLLBACK',
      value: [101, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      blockcomment: 'Codes 200-299: invalid * failures',
    },
    {
      name: 'FAIL_INVLD_NODE_NAME',
      value: [200, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_NODE_TYPE',
      value: [201, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_RSC_NAME',
      value: [202, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_RSC_PORT',
      value: [203, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_NODE_ID',
      value: [204, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_VLM_NR',
      value: [205, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_VLM_SIZE',
      value: [206, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_MINOR_NR',
      value: [207, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_STOR_POOL_NAME',
      value: [208, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_NET_NAME',
      value: [209, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_NET_ADDR',
      value: [210, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_NET_PORT',
      value: [211, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_NET_TYPE',
      value: [212, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_PROP',
      value: [213, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_TRANSPORT_TYPE',
      value: [214, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_TCP_PORT',
      value: [215, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_CRYPT_PASSPHRASE',
      value: [216, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_ENCRYPT_TYPE',
      value: [217, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_SNAPSHOT_NAME',
      value: [218, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_PLACE_COUNT',
      value: [219, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_FREE_SPACE_MGR_NAME',
      value: [220, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_STOR_DRIVER',
      value: [221, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_DRBD_PROXY_COMPRESSION_TYPE',
      value: [222, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_KVS_NAME',
      value: [223, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_LAYER_KIND',
      value: [224, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_LAYER_STACK',
      value: [225, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_EXT_NAME',
      value: [226, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_PROVIDER',
      value: [227, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_VLM_SIZES',
      value: [228, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_VLM_COUNT',
      value: [229, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_CONF',
      value: [230, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_SNAPSHOT_SHIPPING_SOURCE',
      value: [231, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_SNAPSHOT_SHIPPING_TARGET',
      value: [232, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NODE_HAS_USED_RSC',
      value: [233, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_REQUEST',
      value: [234, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_EXT_FILE_NAME',
      value: [235, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_EXT_FILE',
      value: [236, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_RSC_GRP_NAME',
      value: [237, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_BACKUP_CONFIG',
      value: [238, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_REMOTE_NAME',
      value: [239, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_TIME_PARAM',
      value: [240, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_SCHEDULE_NAME',
      value: [241, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_DB_EXPORT_FILE',
      value: [242, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_RSC_STATE',
      value: [243, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INVLD_BLK_SIZE',
      value: [244, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      blockcomment: 'Codes 300-399: dependency not found failures',
    },
    {
      name: 'FAIL_NOT_FOUND_NODE',
      value: [300, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_RSC_DFN',
      value: [301, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_RSC',
      value: [302, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_VLM_DFN',
      value: [303, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_VLM',
      value: [304, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_NET_IF',
      value: [305, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_NODE_CONN',
      value: [306, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_RSC_CONN',
      value: [307, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_VLM_CONN',
      value: [308, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_STOR_POOL_DFN',
      value: [309, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_STOR_POOL',
      value: [310, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_DFLT_STOR_POOL',
      value: [311, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_CRYPT_KEY',
      value: [312, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_SNAPSHOT_DFN',
      value: [313, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_SNAPSHOT_VLM_DFN',
      value: [314, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_SNAPSHOT',
      value: [315, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_KVS',
      value: [316, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_RSC_GRP',
      value: [317, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_VLM_GRP',
      value: [318, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_EXOS_ENCLOSURE',
      value: [319, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_EXT_FILE',
      value: [320, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_REMOTE',
      value: [321, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_BACKUP',
      value: [322, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_FOUND_SCHEDULE',
      value: [323, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      blockcomment: 'Codes 400-499: access denied failures',
    },
    {
      name: 'FAIL_ACC_DENIED_NODE',
      value: [400, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_RSC_DFN',
      value: [401, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_RSC',
      value: [402, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_VLM_DFN',
      value: [403, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_VLM',
      value: [404, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_STOR_POOL_DFN',
      value: [405, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_STOR_POOL',
      value: [406, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_NODE_CONN',
      value: [407, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_RSC_CONN',
      value: [408, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_VLM_CONN',
      value: [409, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_STLT_CONN',
      value: [410, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_CTRL_CFG',
      value: [411, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_COMMAND',
      value: [412, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_WATCH',
      value: [413, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_SNAPSHOT_DFN',
      value: [414, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_SNAPSHOT',
      value: [415, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_SNAPSHOT_VLM_DFN',
      value: [416, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_FREE_SPACE_MGR',
      value: [417, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_KVS',
      value: [418, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_RSC_GRP',
      value: [419, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_VLM_GRP',
      value: [420, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_SNAP_DFN',
      value: [421, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_EXT_FILE',
      value: [422, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_REMOTE',
      value: [423, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ACC_DENIED_SCHEDULE',
      value: [424, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      blockcomment: 'Codes 500-599: data already exists failures',
    },
    {
      name: 'FAIL_EXISTS_NODE',
      value: [500, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_RSC_DFN',
      value: [501, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_RSC',
      value: [502, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_VLM_DFN',
      value: [503, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_VLM',
      value: [504, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_NET_IF',
      value: [505, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_NODE_CONN',
      value: [506, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_RSC_CONN',
      value: [507, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_VLM_CONN',
      value: [508, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_STOR_POOL_DFN',
      value: [509, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_STOR_POOL',
      value: [510, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_STLT_CONN',
      value: [511, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_CRYPT_PASSPHRASE',
      value: [512, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_WATCH',
      value: [513, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_SNAPSHOT_DFN',
      value: [514, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_SNAPSHOT',
      value: [516, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_EXT_NAME',
      value: [517, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_NVME_TARGET_PER_RSC_DFN',
      value: [518, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_NVME_INITIATOR_PER_RSC_DFN',
      value: [519, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_LOST_STOR_POOL',
      value: [521, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_RSC_GRP',
      value: [522, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_VLM_GRP',
      value: [523, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_SNAPSHOT_SHIPPING',
      value: [525, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_EXOS_ENCLOSURE',
      value: [526, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_REMOTE',
      value: [527, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EXISTS_SCHEDULE',
      value: [528, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      blockcomment: 'Codes 600-699: data missing failures',
    },
    {
      name: 'FAIL_MISSING_PROPS',
      value: [600, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_MISSING_PROPS_NETCOM_TYPE',
      value: [601, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_MISSING_PROPS_NETCOM_PORT',
      value: [602, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_MISSING_NETCOM',
      value: [603, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_MISSING_PROPS_NETIF_NAME',
      value: [604, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_MISSING_STLT_CONN',
      value: [605, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_MISSING_EXT_NAME',
      value: [606, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_MISSING_NVME_TARGET',
      value: [608, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NO_STLT_CONN_DEFINED',
      value: [609, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_MISSING_EBS_TARGET',
      value: [611, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      blockcomment: 'Codes 700-799: uuid mismatch failures',
    },
    {
      name: 'FAIL_UUID_NODE',
      value: [700, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UUID_RSC_DFN',
      value: [701, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UUID_RSC',
      value: [702, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UUID_VLM_DFN',
      value: [703, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UUID_VLM',
      value: [704, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UUID_NET_IF',
      value: [705, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UUID_NODE_CONN',
      value: [706, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UUID_RSC_CONN',
      value: [707, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UUID_VLM_CONN',
      value: [708, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UUID_STOR_POOL_DFN',
      value: [709, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UUID_STOR_POOL',
      value: [710, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UUID_KVS',
      value: [711, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      blockcomment: 'Codes 800-899: number pools exhausted',
    },
    {
      name: 'FAIL_POOL_EXHAUSTED_VLM_NR',
      value: [800, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_POOL_EXHAUSTED_MINOR_NR',
      value: [801, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_POOL_EXHAUSTED_TCP_PORT',
      value: [802, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_POOL_EXHAUSTED_NODE_ID',
      value: [803, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_POOL_EXHAUSTED_RSC_LAYER_ID',
      value: [804, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_POOL_EXHAUSTED_SPECIAL_SATELLTE_TCP_PORT',
      value: [805, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_POOL_EXHAUSTED_SNAPSHOT_SHIPPING_TCP_PORT',
      value: [806, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_POOL_EXHAUSTED_BACKUP_SHIPPING_TCP_PORT',
      value: [807, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      blockcomment: 'Other failures',
    },
    {
      name: 'FAIL_SNAPSHOT_ROLLBACK_IN_PROGRESS',
      value: [971, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_SP_MIXING_NOT_ALLOWED',
      value: [972, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EBS_COOLDOWN',
      value: [973, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_ALL_UPTODATE',
      value: [974, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_EVACUATING',
      value: [975, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_BACKUP_UNKNOWN_CLUSTER',
      value: [976, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_DEPENDEND_BACKUP',
      value: [977, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_BACKUP_INCOMPATIBLE_VERSION',
      value: [978, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_SNAPSHOT_NOT_UPTODATE',
      value: [979, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_ENOUGH_FREE_SPACE',
      value: [980, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_ONLY_ONE_ACT_RSC_PER_SHARED_STOR_POOL_ALLOWED',
      value: [981, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_CRYPT_INIT',
      value: [982, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_SNAPSHOT_SHIPPING_NOT_SUPPORTED',
      value: [983, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_SNAPSHOT_SHIPPING_IN_PROGRESS',
      value: [984, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UNDECIDABLE_AUTOPLACMENT',
      value: [985, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_PRE_SELECT_SCRIPT_DID_NOT_TERMINATE',
      value: [986, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_LINSTOR_MANAGED_SATELLITE_DID_NOT_START_PROPERLY',
      value: [987, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_STLT_DOES_NOT_SUPPORT_LAYER',
      value: [988, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_STLT_DOES_NOT_SUPPORT_PROVIDER',
      value: [989, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_STOR_POOL_CONFIGURATION_ERROR',
      value: [990, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INSUFFICIENT_REPLICA_COUNT',
      value: [991, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_RSC_BUSY',
      value: [992, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_INSUFFICIENT_PEER_SLOTS',
      value: [993, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_SNAPSHOTS_NOT_SUPPORTED',
      value: [994, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_CONNECTED',
      value: [995, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_NOT_ENOUGH_NODES',
      value: [996, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_IN_USE',
      value: [997, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_UNKNOWN_ERROR',
      value: [998, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_IMPL_ERROR',
      value: [999, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      blockcomment: 'Codes 1000-9999: warnings',
    },
    {
      name: 'WARN_INVLD_OPT_PROP_NETCOM_ENABLED',
      value: [1001, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_NOT_CONNECTED',
      value: [1002, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_STLT_NOT_UPDATED',
      value: [1003, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_NO_STLT_CONN_DEFINED',
      value: [1004, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_DEL_UNSET_PROP',
      value: [1005, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_RSC_ALREADY_DEPLOYED',
      value: [1006, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_RSC_ALREADY_HAS_DISK',
      value: [1007, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_RSC_ALREADY_DISKLESS',
      value: [1008, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_ALL_DISKLESS',
      value: [1009, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_STORAGE_ERROR',
      value: [1010, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_NOT_FOUND_CRYPT_KEY',
      value: [1011, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_STORAGE_KIND_ADDED',
      value: [1012, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_NOT_ENOUGH_NODES_FOR_TIE_BREAKER',
      value: [1013, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_MIXED_PMEM_AND_NON_PMEM',
      value: [1014, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_UNEFFECTIVE_PROP',
      value: [1015, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_INVLD_SNAPSHOT_SHIPPING_PREFIX',
      value: [1016, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_NODE_EVICTED',
      value: [1017, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_RSC_DEACTIVATED',
      value: [1018, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_BACKUP_DL_ONLY',
      value: [1019, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_NOT_EVACUATING',
      value: [1020, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_INVLD_CONF',
      value: [1021, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_STORPOOL_RENAME_NOT_ALLOWED',
      value: [1022, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_VLMDFN_RESIZE_SAME_SIZE',
      value: [1023, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_NOT_FOUND',
      value: [3000, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      name: 'WARN_DEPRECATED',
      value: [4000, 'MASK_WARN'],
      type: 'BOR',
    },
    {
      blockcomment: 'Codes 10000-19999: info',
    },
    {
      name: 'INFO_NO_RSC_SPAWNED',
      value: [10000, 'MASK_INFO'],
      type: 'BOR',
    },
    {
      name: 'INFO_NODE_NAME_MISMATCH',
      value: [10001, 'MASK_INFO'],
      type: 'BOR',
    },
    {
      name: 'INFO_PROP_SET',
      value: [10002, 'MASK_INFO'],
      type: 'BOR',
    },
    {
      name: 'INFO_TIE_BREAKER_CREATED',
      value: [10003, 'MASK_INFO'],
      type: 'BOR',
    },
    {
      name: 'INFO_TIE_BREAKER_DELETING',
      value: [10004, 'MASK_INFO'],
      type: 'BOR',
    },
    {
      name: 'INFO_TIE_BREAKER_TAKEOVER',
      value: [10006, 'MASK_INFO'],
      type: 'BOR',
    },
    {
      name: 'INFO_PROP_REMOVED',
      value: [10005, 'MASK_INFO'],
      type: 'BOR',
    },
    {
      name: 'INFO_AUTO_DRBD_PROXY_CREATED',
      value: [10007, 'MASK_INFO'],
      type: 'BOR',
    },
    {
      name: 'INFO_NOOP',
      value: [10007, 'MASK_INFO'],
      type: 'BOR',
    },
    {
      name: 'INFO_RSC_ALREADY_EXISTS',
      value: [10008, 'MASK_INFO'],
      type: 'BOR',
    },
    {
      name: 'INFO_ABORTED_FAILED_SNAPSHOT_ROLLBACK',
      value: [10009, 'MASK_INFO'],
      type: 'BOR',
    },
    {
      name: 'INFO_RECOVERING_FAILED_SNAPSHOT_ROLLBACK',
      value: [10010, 'MASK_INFO'],
      type: 'BOR',
    },
    {
      blockcomment: 'Special codes',
    },
    {
      name: 'UNKNOWN_API_CALL',
      value: ['0x0FFFFFFFFFFFFFFFL', 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'API_CALL_AUTH_REQ',
      value: ['0x0FFFFFFFFFFFFFFEL', 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'API_CALL_PARSE_ERROR',
      value: ['0x0FFFFFFFFFFFFFFDL', 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      blockcomment: 'SignIn codes',
    },
    {
      name: 'SUCCESS_SIGN_IN',
      value: [10000, 'MASK_SUCCESS'],
      type: 'BOR',
    },
    {
      name: 'FAIL_SIGN_IN',
      value: [10000, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      name: 'FAIL_SIGN_IN_MISSING_CREDENTIALS',
      value: [10001, 'MASK_ERROR'],
      type: 'BOR',
    },
    {
      blockcomment: 'Special answer message content types',
    },
    {
      name: 'API_REPLY',
      value: 'Reply',
      type: 'string',
      comment: 'Textual MsgApiCallResponse responses',
    },
    {
      name: 'API_END_OF_IMMEDIATE_ANSWERS',
      value: 'EndOfImmediateAnswers',
      type: 'string',
      comment: 'Indicates that the immediate answers to the API call are complete',
    },
    {
      blockcomment: 'Create object APIs',
    },
    {
      name: 'API_CRT_NODE',
      value: 'CrtNode',
      type: 'string',
    },
    {
      name: 'API_CRT_RSC',
      value: 'CrtRsc',
      type: 'string',
    },
    {
      name: 'API_CRT_RSC_DFN',
      value: 'CrtRscDfn',
      type: 'string',
    },
    {
      name: 'API_CRT_NET_IF',
      value: 'CrtNetIf',
      type: 'string',
    },
    {
      name: 'API_CRT_VLM_DFN',
      value: 'CrtVlmDfn',
      type: 'string',
    },
    {
      name: 'API_CRT_SNAPSHOT',
      value: 'CrtSnapshot',
      type: 'string',
    },
    {
      name: 'API_CRT_SNAPSHOT_MULTI',
      value: 'CrtSnapshotMulti',
      type: 'string',
    },
    {
      name: 'API_CRT_BACKUP',
      value: 'CrtBackup',
      type: 'string',
    },
    {
      name: 'API_CRT_STOR_POOL_DFN',
      value: 'CrtStorPoolDfn',
      type: 'string',
    },
    {
      name: 'API_CRT_STOR_POOL',
      value: 'CrtStorPool',
      type: 'string',
    },
    {
      name: 'API_CRT_NODE_CONN',
      value: 'CrtNodeConn',
      type: 'string',
    },
    {
      name: 'API_CRT_RSC_CONN',
      value: 'CrtRscConn',
      type: 'string',
    },
    {
      name: 'API_CRT_VLM_CONN',
      value: 'CrtVlmConn',
      type: 'string',
    },
    {
      name: 'API_AUTO_PLACE_RSC',
      value: 'AutoPlaceRsc',
      type: 'string',
    },
    {
      name: 'API_CLONE_RSCDFN',
      value: 'CloneRscDfn',
      type: 'string',
    },
    {
      name: 'API_CLONE_RSCDFN_STATUS',
      value: 'CloneRscDfnStatus',
      type: 'string',
    },
    {
      name: 'API_CRT_CRYPT_PASS',
      value: 'CrtCryptPass',
      type: 'string',
    },
    {
      name: 'API_STATUS_CRYPT_PASS',
      value: 'StatusCryptPass',
      type: 'string',
    },
    {
      name: 'API_RESTORE_VLM_DFN',
      value: 'RestoreVlmDfn',
      type: 'string',
    },
    {
      name: 'API_RESTORE_SNAPSHOT',
      value: 'RestoreSnapshot',
      type: 'string',
    },
    {
      name: 'API_CRT_RSC_GRP',
      value: 'CrtRscGrp',
      type: 'string',
    },
    {
      name: 'API_CRT_VLM_GRP',
      value: 'CrtVlmGrp',
      type: 'string',
    },
    {
      name: 'API_SPAWN_RSC_DFN',
      value: 'SpawnRscDfn',
      type: 'string',
    },
    {
      name: 'API_ADJUST_RSC_GRP',
      value: 'AdjustRscGrp',
      type: 'string',
    },
    {
      name: 'API_CREATE_DEVICE_POOL',
      value: 'CreateDevicePool',
      type: 'string',
    },
    {
      name: 'API_MAKE_RSC_AVAIL',
      value: 'MakeRscAvail',
      type: 'string',
    },
    {
      name: 'API_SET_REMOTE',
      value: 'SetRemote',
      type: 'string',
    },
    {
      name: 'API_RESTORE_BACKUP',
      value: 'RstBackup',
      type: 'string',
    },
    {
      name: 'API_ABORT_BACKUP',
      value: 'AbortBackup',
      type: 'string',
    },
    {
      name: 'API_SHIP_BACKUP',
      value: 'ShipBackup',
      type: 'string',
    },
    {
      name: 'API_CRT_SCHEDULE',
      value: 'CrtSchedule',
      type: 'string',
    },
    {
      blockcomment: 'Modify object APIs',
    },
    {
      name: 'API_MOD_NODE',
      value: 'ModNode',
      type: 'string',
    },
    {
      name: 'API_MOD_NODE_CONN',
      value: 'ModNodeConn',
      type: 'string',
    },
    {
      name: 'API_MOD_RSC',
      value: 'ModRsc',
      type: 'string',
    },
    {
      name: 'API_TOGGLE_DISK',
      value: 'ToggleDisk',
      type: 'string',
    },
    {
      name: 'API_MOD_RSC_CONN',
      value: 'ModRscConn',
      type: 'string',
    },
    {
      name: 'API_MOD_RSC_DFN',
      value: 'ModRscDfn',
      type: 'string',
    },
    {
      name: 'API_MOD_NET_IF',
      value: 'ModNetIf',
      type: 'string',
    },
    {
      name: 'API_MOD_STOR_POOL',
      value: 'ModStorPool',
      type: 'string',
    },
    {
      name: 'API_MOD_STOR_POOL_DFN',
      value: 'ModStorPoolDfn',
      type: 'string',
    },
    {
      name: 'API_MOD_VLM_DFN',
      value: 'ModVlmDfn',
      type: 'string',
    },
    {
      name: 'API_MOD_VLM_DFN_PASS',
      value: 'ModVlmDfnPassphrase',
      type: 'string',
    },
    {
      name: 'API_MOD_VLM',
      value: 'ModVlm',
      type: 'string',
    },
    {
      name: 'API_MOD_VLM_CONN',
      value: 'ModVlmConn',
      type: 'string',
    },
    {
      name: 'API_MOD_SNAPSHOT',
      value: 'ModSnapshot',
      type: 'string',
    },
    {
      name: 'API_MOD_CRYPT_PASS',
      value: 'ModCryptPass',
      type: 'string',
    },
    {
      name: 'API_ENABLE_DRBD_PROXY',
      value: 'EnableDrbdProxy',
      type: 'string',
    },
    {
      name: 'API_DISABLE_DRBD_PROXY',
      value: 'DisableDrbdProxy',
      type: 'string',
    },
    {
      name: 'API_MOD_DRBD_PROXY',
      value: 'ModifyDrbdProxy',
      type: 'string',
    },
    {
      name: 'API_ROLLBACK_SNAPSHOT',
      value: 'RollbackSnapshot',
      type: 'string',
    },
    {
      name: 'API_MOD_KVS',
      value: 'ModifyKvs',
      type: 'string',
    },
    {
      name: 'API_MOD_RSC_GRP',
      value: 'ModifyRscGrp',
      type: 'string',
    },
    {
      name: 'API_MOD_VLM_GRP',
      value: 'ModifyVlmGrp',
      type: 'string',
    },
    {
      name: 'API_ACTIVATE_RSC',
      value: 'ActivateRsc',
      type: 'string',
    },
    {
      name: 'API_DEACTIVATE_RSC',
      value: 'DeactivateRsc',
      type: 'string',
    },
    {
      name: 'API_MOD_SCHEDULE',
      value: 'ModSchedule',
      type: 'string',
    },
    {
      blockcomment: 'Delete object APIs',
    },
    {
      name: 'API_DEL_NODE',
      value: 'DelNode',
      type: 'string',
    },
    {
      name: 'API_DEL_RSC',
      value: 'DelRsc',
      type: 'string',
    },
    {
      name: 'API_DEL_RSC_DFN',
      value: 'DelRscDfn',
      type: 'string',
    },
    {
      name: 'API_DEL_NET_IF',
      value: 'DelNetIf',
      type: 'string',
    },
    {
      name: 'API_DEL_VLM_DFN',
      value: 'DelVlmDfn',
      type: 'string',
    },
    {
      name: 'API_DEL_STOR_POOL_DFN',
      value: 'DelStorPoolDfn',
      type: 'string',
    },
    {
      name: 'API_DEL_STOR_POOL',
      value: 'DelStorPool',
      type: 'string',
    },
    {
      name: 'API_DEL_NODE_CONN',
      value: 'DelNodeConn',
      type: 'string',
    },
    {
      name: 'API_DEL_RSC_CONN',
      value: 'DelRscConn',
      type: 'string',
    },
    {
      name: 'API_DEL_VLM_CONN',
      value: 'DelVlmConn',
      type: 'string',
    },
    {
      name: 'API_DEL_SNAPSHOT',
      value: 'DelSnapshot',
      type: 'string',
    },
    {
      name: 'API_DEL_KVS',
      value: 'DelKvs',
      type: 'string',
    },
    {
      name: 'API_DEL_RSC_GRP',
      value: 'DelRscGrp',
      type: 'string',
    },
    {
      name: 'API_DEL_VLM_GRP',
      value: 'DelVlmGrp',
      type: 'string',
    },
    {
      name: 'API_DEL_BACKUP',
      value: 'DelBackup',
      type: 'string',
    },
    {
      name: 'API_LOST_NODE',
      value: 'LostNode',
      type: 'string',
    },
    {
      name: 'API_LOST_STOR_POOL',
      value: 'LostStorPool',
      type: 'string',
    },
    {
      name: 'API_DEL_SCHEDULE',
      value: 'DelSchedule',
      type: 'string',
    },
    {
      blockcomment: 'Authentication APIs',
    },
    {
      name: 'API_SIGN_IN',
      value: 'SignIn',
      type: 'string',
    },
    {
      name: 'API_VERSION',
      value: 'Version',
      type: 'string',
    },
    {
      blockcomment: 'Debug APIs',
    },
    {
      name: 'API_CRT_DBG_CNSL',
      value: 'CrtDbgCnsl',
      type: 'string',
    },
    {
      name: 'API_DSTR_DBG_CNSL',
      value: 'DstrDbgCnsl',
      type: 'string',
    },
    {
      blockcomment: 'Command APIs',
    },
    {
      name: 'API_CONTROL_CTRL',
      value: 'ControlCtrl',
      type: 'string',
    },
    {
      name: 'API_CMD_SHUTDOWN',
      value: 'Shutdown',
      type: 'string',
    },
    {
      name: 'API_NODE_RECONNECT',
      value: 'NodeReconnect',
      type: 'string',
    },
    {
      name: 'API_NODE_RESTORE',
      value: 'NodeRestore',
      type: 'string',
    },
    {
      name: 'API_NODE_EVICT',
      value: 'NodeEvict',
      type: 'string',
    },
    {
      name: 'API_NODE_EVACUATE',
      value: 'NodeEvacuate',
      type: 'string',
    },
    {
      blockcomment: 'List object APIs',
    },
    {
      name: 'API_LST_NODE',
      value: 'LstNode',
      type: 'string',
    },
    {
      name: 'API_LST_NODE_CONN',
      value: 'LstNodeConn',
      type: 'string',
    },
    {
      name: 'API_LST_RSC',
      value: 'LstRsc',
      type: 'string',
    },
    {
      name: 'API_LST_RSC_DFN',
      value: 'LstRscDfn',
      type: 'string',
    },
    {
      name: 'API_LST_NET_IF',
      value: 'LstNetIf',
      type: 'string',
    },
    {
      name: 'API_LST_VLM_DFN',
      value: 'LstVlmDfn',
      type: 'string',
    },
    {
      name: 'API_LST_VLM',
      value: 'LstVlm',
      type: 'string',
    },
    {
      name: 'API_LST_SNAPSHOT_DFN',
      value: 'LstSnapshotDfn',
      type: 'string',
    },
    {
      name: 'API_LST_STOR_POOL',
      value: 'LstStorPool',
      type: 'string',
    },
    {
      name: 'API_LST_STOR_POOL_DFN',
      value: 'LstStorPoolDfn',
      type: 'string',
    },
    {
      name: 'API_LST_ERROR_REPORTS',
      value: 'LstErrorReports',
      type: 'string',
    },
    {
      name: 'API_REQ_ERROR_REPORTS',
      value: 'ReqErrorReports',
      type: 'string',
    },
    {
      name: 'API_DEL_ERROR_REPORT',
      value: 'DelErrorReport',
      type: 'string',
    },
    {
      name: 'API_DEL_ERROR_REPORTS',
      value: 'DelErrorReports',
      type: 'string',
    },
    {
      name: 'API_REQ_SOS_REPORT',
      value: 'ReqSosReport',
      type: 'string',
    },
    {
      name: 'API_REQ_RSC_CONN_LIST',
      value: 'ReqRscConnList',
      type: 'string',
    },
    {
      name: 'API_LST_RSC_CONN',
      value: 'LstRscConn',
      type: 'string',
    },
    {
      name: 'API_LST_KVS',
      value: 'LstKvs',
      type: 'string',
    },
    {
      name: 'API_LST_RSC_GRP',
      value: 'LstRscGrp',
      type: 'string',
    },
    {
      name: 'API_LST_VLM_GRP',
      value: 'LstVlmGrp',
      type: 'string',
    },
    {
      name: 'API_LST_PHYS_STOR',
      value: 'LstPhysicalStorage',
      type: 'string',
    },
    {
      name: 'API_LST_BACKUPS',
      value: 'LstBackups',
      type: 'string',
    },
    {
      name: 'API_BACKUP_INFO',
      value: 'BackupInfo',
      type: 'string',
    },
    {
      name: 'API_LST_PROPS_INFO',
      value: 'LstPropsInfo',
      type: 'string',
    },
    {
      name: 'API_LST_REMOTE',
      value: 'LstRemote',
      type: 'string',
    },
    {
      name: 'API_LST_EXT_FILES',
      value: 'LstExtFiles',
      type: 'string',
    },
    {
      name: 'API_NODE_STATS',
      value: 'NodeStats',
      type: 'string',
    },
    {
      name: 'API_RSC_GRP_STATS',
      value: 'RscGrpStats',
      type: 'string',
    },
    {
      name: 'API_RSC_DFN_STATS',
      value: 'RscDfnStats',
      type: 'string',
    },
    {
      name: 'API_RSC_STATS',
      value: 'RscStats',
      type: 'string',
    },
    {
      name: 'API_STOR_POOL_STATS',
      value: 'StorPoolStats',
      type: 'string',
    },
    {
      name: 'API_ERR_REPORT_STATS',
      value: 'ErrReportStats',
      type: 'string',
    },
    {
      name: 'API_LST_SCHEDULE',
      value: 'LstSchedule',
      type: 'string',
    },
    {
      name: 'API_LST_QUEUE',
      value: 'LstQueue',
      type: 'string',
    },
    {
      blockcomment: 'Query APIs',
    },
    {
      name: 'API_QRY_MAX_VLM_SIZE',
      value: 'QryMaxVlmSize',
      type: 'string',
    },
    {
      name: 'API_RSP_MAX_VLM_SIZE',
      value: 'RspMaxVlmSize',
      type: 'string',
    },
    {
      name: 'API_QRY_SIZE_INFO',
      value: 'QrySizeInfo',
      type: 'string',
    },
    {
      name: 'API_QRY_ALL_SIZE_INFO',
      value: 'QryAllSizeInfo',
      type: 'string',
    },
    {
      name: 'API_RSCDFN_SYNC_STATUS',
      value: 'RscDfnSyncStatus',
      type: 'string',
    },
    {
      name: 'API_CHECK_EXT_FILE',
      value: 'CheckExtFile',
      type: 'string',
    },
    {
      blockcomment: 'Event APIs',
    },
    {
      name: 'API_CRT_WATCH',
      value: 'CrtWatch',
      type: 'string',
    },
    {
      name: 'API_DEL_WATCH',
      value: 'DelWatch',
      type: 'string',
    },
    {
      name: 'API_EVENT',
      value: 'Event',
      type: 'string',
    },
    {
      name: 'API_RPT_SPC',
      value: 'RptSpc',
      type: 'string',
    },
    {
      name: 'API_PING',
      value: 'Ping',
      type: 'string',
    },
    {
      name: 'API_PONG',
      value: 'Pong',
      type: 'string',
    },
    {
      name: 'API_MOD_INF',
      value: 'ModInf',
      type: 'string',
    },
    {
      name: 'API_VSN_INF',
      value: 'VsnInf',
      type: 'string',
    },
    {
      name: 'API_SET_CTRL_PROP',
      value: 'SetCtrlProp',
      type: 'string',
    },
    {
      name: 'API_DEL_CTRL_PROP',
      value: 'DelCtrlProp',
      type: 'string',
    },
    {
      name: 'API_LST_CTRL_PROPS',
      value: 'LstCtrlProps',
      type: 'string',
    },
    {
      blockcomment: 'Encryption APIs',
    },
    {
      name: 'API_ENTER_CRYPT_PASS',
      value: 'EnterCryptPass',
      type: 'string',
    },
    {
      blockcomment: 'External files APIs',
    },
    {
      name: 'API_SET_EXT_FILE',
      value: 'SetExtFile',
      type: 'string',
    },
    {
      name: 'API_DEL_EXT_FILE',
      value: 'DeleteExtFile',
      type: 'string',
    },
    {
      name: 'API_DEPLOY_EXT_FILE',
      value: 'DeployExtFile',
      type: 'string',
    },
    {
      name: 'API_UNDEPLOY_EXT_FILE',
      value: 'UndeployExtFile',
      type: 'string',
    },
    {
      blockcomment: 'Database APIs',
    },
    {
      name: 'API_DB_EXPORT',
      value: 'DbExport',
      type: 'string',
    },
    {
      blockcomment: 'DRBD property keys',
    },
    {
      name: 'KEY_UUID',
      value: 'UUID',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_CURRENT_GI',
      value: 'DrbdCurrentGi',
      type: 'string',
    },
    {
      name: 'KEY_DMSTATS',
      value: 'DMStats',
      type: 'string',
    },
    {
      name: 'KEY_QUORUM_SET_BY',
      value: 'QuorumSetBy',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_AUTO_QUORUM',
      value: 'auto-quorum',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_AUTO_BLOCK_SIZE',
      value: 'auto-block-size',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_FREEZE_BLOCK_SIZE',
      value: 'freeze-block-size',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_AUTO_ADD_QUORUM_TIEBREAKER',
      value: 'auto-add-quorum-tiebreaker',
      type: 'string',
    },
    {
      name: 'KEY_MINOR_NR_AUTO_RANGE',
      value: 'MinorNrAutoRange',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_AUTO_DISKFUL',
      value: 'auto-diskful',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_AUTO_DISKFUL_ALLOW_CLEANUP',
      value: 'auto-diskful-allow-cleanup',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_DISABLE_AUTO_RESYNC_AFTER',
      value: 'auto-resync-after-disable',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_DISABLE_AUTO_VERIFY_ALGO',
      value: 'auto-verify-algo-disable',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_AUTO_VERIFY_ALGO_ALLOWED_USER',
      value: 'auto-verify-algo-allowed-user-list',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_AUTO_RS_DISCARD_GRANULARITY',
      value: 'auto-rs-discard-granularity',
      type: 'string',
    },
    {
      name: 'KEY_FORCE_INITIAL_SYNC',
      value: 'ForceInitialSync',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_SKIP_DISK',
      value: 'SkipDisk',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_EXACT_SIZE',
      value: 'ExactSize',
      type: 'string',
    },
    {
      blockcomment: 'Node property keys',
    },
    {
      name: 'KEY_NODE',
      value: 'Node',
      type: 'string',
    },
    {
      name: 'KEY_1ST_NODE',
      value: 'FirstNode',
      type: 'string',
    },
    {
      name: 'KEY_2ND_NODE',
      value: 'SecondNode',
      type: 'string',
    },
    {
      name: 'KEY_CUR_STLT_CONN_NAME',
      value: 'CurStltConnName',
      type: 'string',
    },
    {
      blockcomment: 'Volume-definition property keys',
    },
    {
      name: 'KEY_PASSPHRASE',
      value: 'Passphrase',
      type: 'string',
    },
    {
      blockcomment: 'Resource property keys',
    },
    {
      name: 'KEY_RSC_DFN',
      value: 'RscDfn',
      type: 'string',
    },
    {
      name: 'KEY_RSC_GRP',
      value: 'RscGrp',
      type: 'string',
    },
    {
      name: 'KEY_TCP_PORT_AUTO_RANGE',
      value: 'TcpPortAutoRange',
      type: 'string',
    },
    {
      name: 'KEY_PEER_SLOTS_NEW_RESOURCE',
      value: 'PeerSlotsNewResource',
      type: 'string',
    },
    {
      name: 'KEY_PEER_SLOTS',
      value: 'PeerSlots',
      type: 'string',
    },
    {
      name: 'KEY_RSC_ROLLBACK_TARGET',
      value: 'RollbackTarget',
      type: 'string',
    },
    {
      name: 'KEY_RSC_MIGRATE_FROM',
      value: 'MigrateFrom',
      type: 'string',
    },
    {
      name: 'KEY_RSC_ALLOW_MIXING_DEVICE_KIND',
      value: 'AllowMixingStoragePoolDriver',
      type: 'string',
    },
    {
      name: 'KEY_RSC_DISKFUL_BY',
      value: 'DiskfulBy',
      type: 'string',
    },
    {
      name: 'KEY_BALANCE_RESOURCES_ENABLED',
      value: 'BalanceResourcesEnabled',
      type: 'string',
    },
    {
      name: 'KEY_BALANCE_RESOURCES_INTERVAL',
      value: 'BalanceResourcesInterval',
      type: 'string',
    },
    {
      name: 'KEY_BALANCE_RESOURCES_GRACE_PERIOD',
      value: 'BalanceResourcesGracePeriod',
      type: 'string',
    },
    {
      blockcomment: 'Volume property keys',
    },
    {
      name: 'KEY_VLM_GRP',
      value: 'VlmGrp',
      type: 'string',
    },
    {
      name: 'KEY_VLM_NR',
      value: 'VlmNr',
      type: 'string',
    },
    {
      name: 'KEY_VLM_RESTORE_FROM_RESOURCE',
      value: 'RestoreFromResource',
      type: 'string',
    },
    {
      name: 'KEY_VLM_RESTORE_FROM_SNAPSHOT',
      value: 'RestoreFromSnapshot',
      type: 'string',
    },
    {
      blockcomment: 'ldap property keys',
    },
    {
      name: 'KEY_SEARCH_DOMAIN',
      value: 'SearchDomain',
      type: 'string',
    },
    {
      blockcomment: 'nvme property keys',
    },
    {
      name: 'KEY_TR_TYPE',
      value: 'TRType',
      type: 'string',
    },
    {
      blockcomment: 'Snapshot property keys',
    },
    {
      name: 'KEY_SNAPSHOT',
      value: 'Snapshot',
      type: 'string',
    },
    {
      name: 'KEY_SNAPSHOT_DFN_SEQUENCE_NUMBER',
      value: 'SequenceNumber',
      type: 'string',
    },
    {
      blockcomment: 'Network Interface property keys',
    },
    {
      name: 'KEY_PORT',
      value: 'Port',
      type: 'string',
    },
    {
      name: 'KEY_DISABLE_HTTP_METRICS',
      value: 'disable-http-metrics',
      type: 'string',
    },
    {
      blockcomment: 'Writecache property keys',
    },
    {
      name: 'KEY_WRITECACHE_BLOCKSIZE',
      value: 'Blocksize',
      type: 'string',
    },
    {
      name: 'KEY_WRITECACHE_POOL_NAME',
      value: 'PoolName',
      type: 'string',
    },
    {
      name: 'KEY_WRITECACHE_SIZE',
      value: 'Size',
      type: 'string',
    },
    {
      name: 'KEY_WRITECACHE_OPTION_HIGH_WATERMARK',
      value: 'HighWatermark',
      type: 'string',
    },
    {
      name: 'KEY_WRITECACHE_OPTION_LOW_WATERMARK',
      value: 'LowWatermark',
      type: 'string',
    },
    {
      name: 'KEY_WRITECACHE_OPTION_START_SECTOR',
      value: 'StartSector',
      type: 'string',
    },
    {
      name: 'KEY_WRITECACHE_OPTION_WRITEBACK_JOBS',
      value: 'WritebackJobs',
      type: 'string',
    },
    {
      name: 'KEY_WRITECACHE_OPTION_AUTOCOMMIT_BLOCKS',
      value: 'AutocommitBlocks',
      type: 'string',
    },
    {
      name: 'KEY_WRITECACHE_OPTION_AUTOCOMMIT_TIME',
      value: 'AutocommitTime',
      type: 'string',
    },
    {
      name: 'KEY_WRITECACHE_OPTION_FUA',
      value: 'Fua',
      type: 'string',
    },
    {
      name: 'KEY_WRITECACHE_OPTION_ADDITIONAL',
      value: 'Additional',
      type: 'string',
    },
    {
      blockcomment: 'Cache property keys',
    },
    {
      name: 'KEY_CACHE_OPERATING_MODE',
      value: 'OpMode',
      type: 'string',
    },
    {
      name: 'KEY_CACHE_META_POOL_NAME',
      value: 'MetaPool',
      type: 'string',
    },
    {
      name: 'KEY_CACHE_CACHE_POOL_NAME',
      value: 'CachePool',
      type: 'string',
    },
    {
      name: 'KEY_CACHE_META_SIZE',
      value: 'Metasize',
      type: 'string',
    },
    {
      name: 'KEY_CACHE_CACHE_SIZE',
      value: 'Cachesize',
      type: 'string',
    },
    {
      name: 'KEY_CACHE_BLOCK_SIZE',
      value: 'Blocksize',
      type: 'string',
    },
    {
      name: 'KEY_CACHE_POLICY',
      value: 'Policy',
      type: 'string',
    },
    {
      name: 'KEY_UPDATE_CACHE_INTERVAL',
      value: 'UpdateCacheInterval',
      type: 'string',
    },
    {
      name: 'KEY_CACHE_FLUSH_TIMEOUT',
      value: 'FlushTimeout',
      type: 'string',
    },
    {
      blockcomment: 'BCache property keys',
    },
    {
      name: 'KEY_BCACHE_POOL_NAME',
      value: 'PoolName',
      type: 'string',
    },
    {
      name: 'KEY_BCACHE_SIZE',
      value: 'Size',
      type: 'string',
    },
    {
      name: 'KEY_BCACHE_BLOCKSIZE',
      value: 'Blocksize',
      type: 'string',
    },
    {
      name: 'KEY_BCACHE_BUCKETSIZE',
      value: 'Bucketsize',
      type: 'string',
    },
    {
      name: 'KEY_BCACHE_DATA_OFFSET',
      value: 'DataOffset',
      type: 'string',
    },
    {
      name: 'KEY_BCACHE_WRITEBACK',
      value: 'Writeback',
      type: 'string',
    },
    {
      name: 'KEY_BCACHE_DISCARD',
      value: 'Discard',
      type: 'string',
    },
    {
      name: 'KEY_BCACHE_CACHE_REPLACEMENT_POLICY',
      value: 'CacheReplacementPolicy',
      type: 'string',
    },
    {
      blockcomment: 'Autoplace property keys',
    },
    {
      name: 'KEY_AUTOPLACE_STRAT_WEIGHT_MAX_FREESPACE',
      value: 'MaxFreeSpace',
      type: 'string',
    },
    {
      name: 'KEY_AUTOPLACE_STRAT_WEIGHT_MIN_RESERVED_SPACE',
      value: 'MinReservedSpace',
      type: 'string',
    },
    {
      name: 'KEY_AUTOPLACE_STRAT_WEIGHT_MIN_RSC_COUNT',
      value: 'MinRscCount',
      type: 'string',
    },
    {
      name: 'KEY_AUTOPLACE_PRE_SELECT_FILE_NAME',
      value: 'PreSelectScript',
      type: 'string',
    },
    {
      name: 'KEY_AUTOPLACE_PRE_SELECT_SCRIPT_TIMEOUT',
      value: 'PreSelectScriptTimeout',
      type: 'string',
    },
    {
      name: 'KEY_AUTOPLACE_MAX_THROUGHPUT',
      value: 'MaxThroughput',
      type: 'string',
    },
    {
      name: 'KEY_SITE',
      value: 'Site',
      type: 'string',
    },
    {
      name: 'KEY_AUTOPLACE_ALLOW_TARGET',
      value: 'AutoplaceTarget',
      type: 'string',
    },
    {
      blockcomment: 'Auto-Evict property keys',
    },
    {
      name: 'KEY_AUTO_EVICT_MIN_REPLICA_COUNT',
      value: 'AutoEvictMinReplicaCount',
      type: 'string',
    },
    {
      name: 'KEY_AUTO_EVICT_AFTER_TIME',
      value: 'AutoEvictAfterTime',
      type: 'string',
    },
    {
      name: 'KEY_AUTO_EVICT_MAX_DISCONNECTED_NODES',
      value: 'AutoEvictMaxDisconnectedNodes',
      type: 'string',
    },
    {
      name: 'KEY_AUTO_EVICT_ALLOW_EVICTION',
      value: 'AutoEvictAllowEviction',
      type: 'string',
    },
    {
      blockcomment: 'Snapshot shipping property keys',
    },
    {
      name: 'KEY_TARGET_NODE',
      value: 'TargetNode',
      type: 'string',
    },
    {
      name: 'KEY_SOURCE_NODE',
      value: 'SourceNode',
      type: 'string',
    },
    {
      name: 'KEY_RUN_EVERY',
      value: 'RunEvery',
      type: 'string',
    },
    {
      name: 'KEY_AUTO_SNAPSHOT_PREFIX',
      value: 'Prefix',
      type: 'string',
    },
    {
      name: 'KEY_KEEP',
      value: 'Keep',
      type: 'string',
    },
    {
      name: 'KEY_AUTO_SNAPSHOT_NEXT_ID',
      value: 'NextAutoId',
      type: 'string',
    },
    {
      name: 'KEY_TCP_PORT_RANGE',
      value: 'TcpPortRange',
      type: 'string',
    },
    {
      blockcomment: 'Backup shipping property keys',
    },
    {
      name: 'KEY_BACKUP_TIMEOUT',
      value: 'BackupTimeout',
      type: 'string',
    },
    {
      name: 'KEY_BACKUP_S3_SUFFIX',
      value: 'S3KeySuffix',
      type: 'string',
    },
    {
      name: 'KEY_REMOTE',
      value: 'Remote',
      type: 'string',
    },
    {
      name: 'KEY_MAX_CONCURRENT_BACKUPS_PER_NODE',
      value: 'MaxConcurrentBackupsPerNode',
      type: 'string',
    },
    {
      name: 'VAL_NODE_UNDECIDED',
      value: '<undecided>',
      type: 'string',
    },
    {
      name: 'KEY_ALLOW_FORCE_RESTORE',
      value: 'AllowForceRestore',
      type: 'string',
    },
    {
      name: 'KEY_RECV_TIMEOUT_IN_MS',
      value: 'L2LReceiveStartedTimeout',
      type: 'string',
    },
    {
      name: 'KEY_BACKUP_L2L_SKIP_WAIT_FOR_START',
      value: 'L2LSkipWaitForStart',
      type: 'string',
    },
    {
      name: 'KEY_COPY_ALL_SNAPS',
      value: 'CopyAllSnaps',
      type: 'string',
    },
    {
      name: 'KEY_COPY_ALL_SNAPS_ON_EVAC',
      value: 'CopyAllSnapsOnEvacuate',
      type: 'string',
    },
    {
      blockcomment: 'Clone property keys',
    },
    {
      name: 'KEY_USE_ZFS_CLONE',
      value: 'UseZFSClone',
      type: 'string',
    },
    {
      blockcomment: 'NetCom namespaces',
    },
    {
      name: 'KEY_NETCOM_ENABLED',
      value: 'Enabled',
      type: 'string',
    },
    {
      name: 'KEY_NETCOM_BIND_ADDRESS',
      value: 'BindAddress',
      type: 'string',
    },
    {
      name: 'KEY_NETCOM_KEY_PASSWD',
      value: 'KeyPasswd',
      type: 'string',
    },
    {
      name: 'KEY_NETCOM_KEY_STORE',
      value: 'KeyStore',
      type: 'string',
    },
    {
      name: 'KEY_NETCOM_KEY_STORE_PASSWD',
      value: 'KeyStorePasswd',
      type: 'string',
    },
    {
      name: 'KEY_NETCOM_PORT',
      value: 'Port',
      type: 'string',
    },
    {
      name: 'KEY_NETCOM_SSL_PROTOCOL',
      value: 'SslProtocol',
      type: 'string',
    },
    {
      name: 'KEY_NETCOM_TRUST_STORE',
      value: 'TrustStore',
      type: 'string',
    },
    {
      name: 'KEY_NETCOM_TRUST_STORE_PASSWD',
      value: 'TrustStorePasswd',
      type: 'string',
    },
    {
      name: 'KEY_NETCOM_TYPE',
      value: 'Type',
      type: 'string',
    },
    {
      blockcomment: 'Property namespaces',
    },
    {
      name: 'NAMESPC_NETCOM',
      value: 'NetCom',
      type: 'string',
    },
    {
      name: 'NAMESPC_DFLT',
      value: 'Default',
      type: 'string',
    },
    {
      name: 'NAMESPC_LOGGING',
      value: 'Logging',
      type: 'string',
    },
    {
      name: 'NAMESPC_ALLOC',
      value: 'Allocation',
      type: 'string',
    },
    {
      name: 'NAMESPC_NETIF',
      value: 'NetIf',
      type: 'string',
    },
    {
      name: 'NAMESPC_STLT',
      value: 'Satellite',
      type: 'string',
    },
    {
      name: 'NAMESPC_NODE',
      value: 'Node',
      type: 'string',
    },
    {
      name: 'NAMESPC_STORAGE_DRIVER',
      value: 'StorDriver',
      type: 'string',
    },
    {
      name: 'NAMESPC_DRBD_PROXY',
      value: 'DrbdProxy',
      type: 'string',
    },
    {
      name: 'NAMESPC_AUXILIARY',
      value: 'Aux',
      type: 'string',
    },
    {
      name: 'NAMESPC_LINSTOR_DRBD',
      value: 'Linstor/Drbd',
      type: 'string',
    },
    {
      name: 'NAMESPC_DRBD_OPTIONS',
      value: 'DrbdOptions',
      type: 'string',
    },
    {
      name: 'NAMESPC_DRBD_NET_OPTIONS',
      value: 'DrbdOptions/Net',
      type: 'string',
    },
    {
      name: 'NAMESPC_DRBD_DISK_OPTIONS',
      value: 'DrbdOptions/Disk',
      type: 'string',
    },
    {
      name: 'NAMESPC_DRBD_RESOURCE_OPTIONS',
      value: 'DrbdOptions/Resource',
      type: 'string',
    },
    {
      name: 'NAMESPC_DRBD_PEER_DEVICE_OPTIONS',
      value: 'DrbdOptions/PeerDevice',
      type: 'string',
    },
    {
      name: 'NAMESPC_DRBD_PROXY_OPTIONS',
      value: 'DrbdOptions/Proxy',
      type: 'string',
    },
    {
      name: 'NAMESPC_DRBD_PROXY_COMPRESSION_OPTIONS',
      value: 'DrbdOptions/ProxyCompression',
      type: 'string',
    },
    {
      name: 'NAMESPC_DRBD_HANDLER_OPTIONS',
      value: 'DrbdOptions/Handlers',
      type: 'string',
    },
    {
      name: 'NAMESPC_CONNECTION_PATHS',
      value: 'Paths',
      type: 'string',
    },
    {
      name: 'NAMESPC_INTERNAL_DRBD',
      value: 'Internal/Drbd',
      type: 'string',
    },
    {
      name: 'NAMESPC_REST',
      value: 'REST',
      type: 'string',
    },
    {
      name: 'NAMESPC_FILESYSTEM',
      value: 'FileSystem',
      type: 'string',
    },
    {
      name: 'NAMESPC_NVME',
      value: 'NVMe',
      type: 'string',
    },
    {
      name: 'NAMESPC_SYS_FS',
      value: 'sys/fs',
      type: 'string',
    },
    {
      name: 'NAMESPC_WRITECACHE',
      value: 'Writecache',
      type: 'string',
    },
    {
      name: 'NAMESPC_WRITECACHE_OPTIONS',
      value: 'Writecache/Options',
      type: 'string',
    },
    {
      name: 'NAMESPC_CACHE',
      value: 'Cache',
      type: 'string',
    },
    {
      name: 'NAMESPC_CACHE_FEATURES',
      value: 'Cache/Features',
      type: 'string',
    },
    {
      name: 'NAMESPC_CACHE_POLICY_ARGS',
      value: 'Cache/Policy',
      type: 'string',
    },
    {
      name: 'NAMESPC_BCACHE',
      value: 'BCache',
      type: 'string',
    },
    {
      name: 'NAMESPC_AUTOPLACER',
      value: 'Autoplacer',
      type: 'string',
    },
    {
      name: 'NAMESPC_AUTOPLACER_WEIGHTS',
      value: 'Autoplacer/Weights',
      type: 'string',
    },
    {
      name: 'NAMESPC_SNAPSHOT_SHIPPING',
      value: 'SnapshotShipping',
      type: 'string',
    },
    {
      name: 'NAMESPC_AUTO_SNAPSHOT',
      value: 'AutoSnapshot',
      type: 'string',
    },
    {
      name: 'NAMESPC_STLT_DEV_SYMLINKS',
      value: 'Satellite/Device/Symlinks',
      type: 'string',
    },
    {
      name: 'NAMESPC_BACKUP_SHIPPING',
      value: 'BackupShipping',
      type: 'string',
    },
    {
      name: 'NAMESPC_CLUSTER',
      value: 'Cluster',
      type: 'string',
    },
    {
      name: 'NAMESPC_CLUSTER_REMOTE',
      value: 'Cluster/Remote',
      type: 'string',
    },
    {
      name: 'NAMESPC_SED',
      value: 'SED',
      type: 'string',
    },
    {
      name: 'NAMESPC_EBS',
      value: 'EBS',
      type: 'string',
    },
    {
      name: 'NAMESPC_TAGS',
      value: 'Tags',
      type: 'string',
    },
    {
      name: 'NAMESPC_ENCRYPTION',
      value: 'Encryption',
      type: 'string',
    },
    {
      name: 'NAMESPC_ZFS',
      value: 'Zfs',
      type: 'string',
    },
    {
      blockcomment: 'Storage pool property keys',
    },
    {
      name: 'KEY_STOR_POOL_DFN',
      value: 'StorPoolDfn',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_NAME',
      value: 'StorPoolName',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_DRBD_META_NAME',
      value: 'StorPoolNameDrbdMeta',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_VOLUME_GROUP',
      value: 'LvmVg',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_LVCREATE_TYPE',
      value: 'LvcreateType',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_LVCREATE_OPTIONS',
      value: 'LvcreateOptions',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_LVCREATE_SNAPSHOT_OPTIONS',
      value: 'LvcreateSnapshotOptions',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_THIN_POOL',
      value: 'ThinPool',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_LVM_SIZES_CACHE_TIME',
      value: 'SizesCacheTime',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_ZPOOL',
      value: 'ZPool',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_ZPOOLTHIN',
      value: 'ZPoolThin',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_ZFS_CREATE_OPTIONS',
      value: 'ZfscreateOptions',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_ZFS_SNAPSHOT_OPTIONS',
      value: 'ZfsSnapshotOptions',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_FILE_DIRECTORY',
      value: 'FileDir',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_PREF_NIC',
      value: 'PrefNic',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_CRYPT_PASSWD',
      value: 'CryptPasswd',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_OVERRIDE_VLM_ID',
      value: 'OverrideVlmId',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_MAX_OVERSUBSCRIPTION_RATIO',
      value: 'MaxOversubscriptionRatio',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_MAX_FREE_CAPACITY_OVERSUBSCRIPTION_RATIO',
      value: 'MaxFreeCapacityOversubscriptionRatio',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_MAX_TOTAL_CAPACITY_OVERSUBSCRIPTION_RATIO',
      value: 'MaxTotalCapacityOversubscriptionRatio',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_WAIT_TIMEOUT_AFTER_CREATE',
      value: 'WaitTimeoutAfterCreate',
      type: 'string',
    },
    {
      name: 'KEY_SPEC_STLT_PORT_AUTO_RANGE',
      value: 'SpecStltPortAutoRange',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_REMOTE_SPDK_API_HOST',
      value: 'RemoteSpdk/ApiHost',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_REMOTE_SPDK_API_PORT',
      value: 'RemoteSpdk/ApiPort',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_REMOTE_SPDK_API_USER_NAME',
      value: 'RemoteSpdk/UserName',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_REMOTE_SPDK_API_USER_PW',
      value: 'RemoteSpdk/UserPassword',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_REMOTE_SPDK_API_USER_NAME_ENV',
      value: 'RemoteSpdk/UserNameEnv',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_REMOTE_SPDK_API_USER_PW_ENV',
      value: 'RemoteSpdk/UserPasswordEnv',
      type: 'string',
    },
    {
      name: 'KEY_EBS_VOLUME_TYPE',
      value: 'EBS/VolumeType',
      type: 'string',
    },
    {
      name: 'KEY_PREF_NIC',
      value: 'PrefNic',
      type: 'string',
    },
    {
      name: 'KEY_ZFS_ROLLBACK_STRATEGY',
      value: 'RollbackStrategy',
      type: 'string',
    },
    {
      name: 'KEY_ZFS_DELETE_STRATEGY',
      value: 'DeleteStrategy',
      type: 'string',
    },
    {
      blockcomment: 'Storage pool traits keys',
    },
    {
      name: 'KEY_STOR_POOL_SUPPORTS_SNAPSHOTS',
      value: 'SupportsSnapshots',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_PROVISIONING',
      value: 'Provisioning',
      type: 'string',
    },
    {
      name: 'KEY_STOR_POOL_ALLOCATION_UNIT',
      value: 'AllocationUnit',
      type: 'string',
      comment: 'Unit of smallest allocation. The size in KiB as a decimal number.',
    },
    {
      blockcomment: 'Storage pool traits values',
    },
    {
      name: 'VAL_STOR_POOL_PROVISIONING_FAT',
      value: 'Fat',
      type: 'string',
    },
    {
      name: 'VAL_STOR_POOL_PROVISIONING_THIN',
      value: 'Thin',
      type: 'string',
    },
    {
      name: 'VAL_STOR_POOL_DRBD_META_INTERNAL',
      value: '.internal',
      type: 'string',
    },
    {
      name: 'VAL_STOR_POOL_SPACE_NOT_FOUND',
      value: -1,
      type: 'long',
    },
    {
      name: 'VAL_STOR_POOL_SPACE_ENOUGH',
      value: '9223372036854775807L',
      type: 'long',
    },
    {
      blockcomment: 'Storage pool ZFS values',
    },
    {
      name: 'VAL_STOR_POOL_ZFS_ROLLBACK_STRAT_ROLLBACK',
      value: 'Rollback',
      type: 'string',
    },
    {
      name: 'VAL_STOR_POOL_ZFS_ROLLBACK_STRAT_CLONE',
      value: 'Clone',
      type: 'string',
    },
    {
      name: 'VAL_STOR_POOL_ZFS_ROLLBACK_STRAT_DYNAMIC',
      value: 'Dynamic',
      type: 'string',
    },
    {
      name: 'VAL_STOR_POOL_ZFS_DELETE_STRAT_DESTROY',
      value: 'Destroy',
      type: 'string',
    },
    {
      name: 'VAL_STOR_POOL_ZFS_DELETE_STRAT_RENAME',
      value: 'Rename',
      type: 'string',
    },
    {
      name: 'VAL_STOR_POOL_ZFS_DELETE_STRAT_DYNAMIC',
      value: 'Dynamic',
      type: 'string',
    },
    {
      blockcomment: 'Storage driver options',
    },
    {
      name: 'KEY_STOR_DRIVER_LUKS_FORMAT_OPTIONS',
      value: 'LuksFormatOptions',
      type: 'string',
    },
    {
      name: 'KEY_STOR_DRIVER_LUKS_OPEN_OPTIONS',
      value: 'LuksOpenOptions',
      type: 'string',
    },
    {
      blockcomment: "DRBD Proxy keys (other than 'options')",
    },
    {
      name: 'KEY_DRBD_PROXY_COMPRESSION_TYPE',
      value: 'CompressionType',
      type: 'string',
    },
    {
      name: 'KEY_DRBD_PROXY_AUTO_ENABLE',
      value: 'AutoEnable',
      type: 'string',
    },
    {
      blockcomment: 'File system property keys',
    },
    {
      name: 'KEY_FS_TYPE',
      value: 'Type',
      type: 'string',
    },
    {
      name: 'KEY_FS_MKFSPARAMETERS',
      value: 'MkfsParams',
      type: 'string',
    },
    {
      name: 'KEY_FS_USER',
      value: 'User',
      type: 'string',
    },
    {
      name: 'KEY_FS_GROUP',
      value: 'Group',
      type: 'string',
    },
    {
      name: 'VAL_FS_TYPE_EXT4',
      value: 'ext4',
      type: 'string',
    },
    {
      name: 'VAL_FS_TYPE_XFS',
      value: 'xfs',
      type: 'string',
    },
    {
      blockcomment: 'sys/fs property keys',
    },
    {
      name: 'KEY_SYS_FS_BLKIO_THROTTLE_READ',
      value: 'blkio_throttle_read',
      type: 'string',
    },
    {
      name: 'KEY_SYS_FS_BLKIO_THROTTLE_WRITE',
      value: 'blkio_throttle_write',
      type: 'string',
    },
    {
      name: 'KEY_SYS_FS_BLKIO_THROTTLE_READ_IOPS',
      value: 'blkio_throttle_read_iops',
      type: 'string',
    },
    {
      name: 'KEY_SYS_FS_BLKIO_THROTTLE_WRITE_IOPS',
      value: 'blkio_throttle_write_iops',
      type: 'string',
    },
    {
      blockcomment: 'Property values',
    },
    {
      name: 'VAL_NETCOM_TYPE_SSL',
      value: 'SSL',
      type: 'string',
    },
    {
      name: 'VAL_NETCOM_TYPE_PLAIN',
      value: 'Plain',
      type: 'string',
    },
    {
      name: 'VAL_SSL_PROTO_TLSv1',
      value: 'TLSv1',
      type: 'string',
    },
    {
      blockcomment: 'DRBD related property values',
    },
    {
      name: 'VAL_DRBD_PROXY_COMPRESSION_NONE',
      value: 'none',
      type: 'string',
    },
    {
      name: 'VAL_DRBD_PROXY_COMPRESSION_ZSTD',
      value: 'zstd',
      type: 'string',
    },
    {
      name: 'VAL_DRBD_PROXY_COMPRESSION_ZLIB',
      value: 'zlib',
      type: 'string',
    },
    {
      name: 'VAL_DRBD_PROXY_COMPRESSION_LZMA',
      value: 'lzma',
      type: 'string',
    },
    {
      name: 'VAL_DRBD_PROXY_COMPRESSION_LZ4',
      value: 'lz4',
      type: 'string',
    },
    {
      name: 'VAL_DRBD_AUTO_QUORUM_DISABLED',
      value: 'disabled',
      type: 'string',
    },
    {
      name: 'VAL_DRBD_AUTO_QUORUM_IO_ERROR',
      value: 'io-error',
      type: 'string',
    },
    {
      name: 'VAL_DRBD_AUTO_QUORUM_SUSPEND_IO',
      value: 'suspend-io',
      type: 'string',
    },
    {
      blockcomment: 'Node Type values',
    },
    {
      name: 'VAL_NODE_TYPE_CTRL',
      value: 'Controller',
      type: 'string',
    },
    {
      name: 'VAL_NODE_TYPE_STLT',
      value: 'Satellite',
      type: 'string',
    },
    {
      name: 'VAL_NODE_TYPE_CMBD',
      value: 'Combined',
      type: 'string',
    },
    {
      name: 'VAL_NODE_TYPE_AUX',
      value: 'Auxiliary',
      type: 'string',
    },
    {
      name: 'VAL_NODE_TYPE_REMOTE_SPDK',
      value: 'Remote_Spdk',
      type: 'string',
    },
    {
      blockcomment: 'Writecache option values',
    },
    {
      name: 'VAL_WRITECACHE_FUA_ON',
      value: 'On',
      type: 'string',
    },
    {
      name: 'VAL_WRITECACHE_FUA_OFF',
      value: 'Off',
      type: 'string',
    },
    {
      blockcomment: 'Net interface Type values',
    },
    {
      name: 'VAL_NETIF_TYPE_IP',
      value: 'IP',
      type: 'string',
    },
    {
      name: 'VAL_NETIF_TYPE_RDMA',
      value: 'RDMA',
      type: 'string',
    },
    {
      name: 'VAL_NETIF_TYPE_ROCE',
      value: 'RoCE',
      type: 'string',
    },
    {
      blockcomment: 'Authentication keys',
    },
    {
      name: 'KEY_SEC_IDENTITY',
      value: 'SecIdentity',
      type: 'string',
    },
    {
      name: 'KEY_SEC_ROLE',
      value: 'SecRole',
      type: 'string',
    },
    {
      name: 'KEY_SEC_TYPE',
      value: 'SecType',
      type: 'string',
    },
    {
      name: 'KEY_SEC_DOMAIN',
      value: 'SecDomain',
      type: 'string',
    },
    {
      name: 'KEY_SEC_PASSWORD',
      value: 'SecPassword',
      type: 'string',
    },
    {
      name: 'KEY_POOL_NAME',
      value: 'PoolName',
      type: 'string',
    },
    {
      blockcomment: 'External commands keys',
    },
    {
      name: 'KEY_EXT_CMD_WAIT_TO',
      value: 'ExtCmdWaitTimeout',
      type: 'string',
    },
    {
      blockcomment: 'External files keys',
    },
    {
      name: 'KEY_EXT_FILE',
      value: 'ExtFile',
      type: 'string',
    },
    {
      blockcomment: 'Default ports',
    },
    {
      name: 'DFLT_CTRL_PORT_SSL',
      value: 3371,
      type: 'int',
    },
    {
      name: 'DFLT_CTRL_PORT_PLAIN',
      value: 3370,
      type: 'int',
    },
    {
      name: 'DFLT_STLT_PORT_SSL',
      value: 3367,
      type: 'int',
    },
    {
      name: 'DFLT_STLT_PORT_PLAIN',
      value: 3366,
      type: 'int',
    },
    {
      blockcomment: 'Boolean values',
    },
    {
      name: 'VAL_TRUE',
      value: 'True',
      type: 'string',
    },
    {
      name: 'VAL_FALSE',
      value: 'False',
      type: 'string',
    },
    {
      name: 'VAL_YES',
      value: 'Yes',
      type: 'string',
    },
    {
      name: 'VAL_NO',
      value: 'No',
      type: 'string',
    },
    {
      blockcomment: 'Flag string values',
    },
    {
      name: 'FLAG_CLEAN',
      value: 'CLEAN',
      type: 'string',
    },
    {
      name: 'FLAG_EVICTED',
      value: 'EVICTED',
      type: 'string',
    },
    {
      name: 'FLAG_EVACUATE',
      value: 'EVACUATE',
      type: 'string',
    },
    {
      name: 'FLAG_DELETE',
      value: 'DELETE',
      type: 'string',
    },
    {
      name: 'FLAG_DRBD_DELETE',
      value: 'DRBD_DELETE',
      type: 'string',
    },
    {
      name: 'FLAG_DISKLESS',
      value: 'DISKLESS',
      type: 'string',
    },
    {
      name: 'FLAG_QIGNORE',
      value: 'QIGNORE',
      type: 'string',
    },
    {
      name: 'FLAG_ENCRYPTED',
      value: 'ENCRYPTED',
      type: 'string',
    },
    {
      name: 'FLAG_GROSS_SIZE',
      value: 'GROSS_SIZE',
      type: 'string',
    },
    {
      name: 'FLAG_SUCCESSFUL',
      value: 'SUCCESSFUL',
      type: 'string',
    },
    {
      name: 'FLAG_SHIPPING',
      value: 'SHIPPING',
      type: 'string',
    },
    {
      name: 'FLAG_SHIPPING_CLEANUP',
      value: 'SHIPPING_CLEANUP',
      type: 'string',
    },
    {
      name: 'FLAG_SHIPPING_ABORT',
      value: 'SHIPPING_ABORT',
      type: 'string',
    },
    {
      name: 'FLAG_SHIPPED',
      value: 'SHIPPED',
      type: 'string',
    },
    {
      name: 'FLAG_AUTO_SNAPSHOT',
      value: 'AUTO_SNAPSHOT',
      type: 'string',
    },
    {
      name: 'FLAG_BACKUP',
      value: 'BACKUP',
      type: 'string',
    },
    {
      name: 'FLAG_RESTORE_BACKUP_ON_SUCCESS',
      value: 'RESTORE_BACKUP_ON_SUCCESS',
      type: 'string',
    },
    {
      name: 'FLAG_BACKUP_TARGET',
      value: 'BACKUP_TARGET',
      type: 'string',
    },
    {
      name: 'FLAG_BACKUP_SOURCE',
      value: 'BACKUP_SOURCE',
      type: 'string',
    },
    {
      name: 'FLAG_FAILED_DEPLOYMENT',
      value: 'FAILED_DEPLOYMENT',
      type: 'string',
    },
    {
      name: 'FLAG_FAILED_DISCONNECT',
      value: 'FAILED_DISCONNECT',
      type: 'string',
    },
    {
      name: 'FLAG_RESIZE',
      value: 'RESIZE',
      type: 'string',
    },
    {
      name: 'FLAG_DISK_ADDING',
      value: 'DISK_ADDING',
      type: 'string',
    },
    {
      name: 'FLAG_DISK_ADD_REQUESTED',
      value: 'DISK_ADD_REQUESTED',
      type: 'string',
    },
    {
      name: 'FLAG_DISK_REMOVING',
      value: 'DISK_REMOVING',
      type: 'string',
    },
    {
      name: 'FLAG_DISK_REMOVE_REQUESTED',
      value: 'DISK_REMOVE_REQUESTED',
      type: 'string',
    },
    {
      name: 'FLAG_TIE_BREAKER',
      value: 'TIE_BREAKER',
      type: 'string',
    },
    {
      name: 'FLAG_DRBD_DISKLESS',
      value: 'DRBD_DISKLESS',
      type: 'string',
    },
    {
      name: 'FLAG_NVME_INITIATOR',
      value: 'NVME_INITIATOR',
      type: 'string',
    },
    {
      name: 'FLAG_RSC_INACTIVE',
      value: 'INACTIVE',
      type: 'string',
    },
    {
      name: 'FLAG_EBS_INITIATOR',
      value: 'EBS_INITIATOR',
      type: 'string',
    },
    {
      name: 'FLAG_CLONING',
      value: 'CLONING',
      type: 'string',
    },
    {
      name: 'FLAG_FAILED',
      value: 'FAILED',
      type: 'string',
    },
    {
      name: 'FLAG_RESTORE_TARGET',
      value: 'RESTORE_TARGET',
      type: 'string',
    },
    {
      blockcomment: 'Device layer kinds',
    },
    {
      name: 'DeviceLayerKind',
      type: 'enum',
      enumtype: 'string',
      values: [
        {
          name: 'DRBD',
          value: 'DRBD',
        },
        {
          name: 'LUKS',
          value: 'LUKS',
        },
        {
          name: 'STORAGE',
          value: 'STORAGE',
        },
        {
          name: 'NVME',
          value: 'NVME',
        },
        {
          name: 'WRITECACHE',
          value: 'WRITECACHE',
        },
        {
          name: 'CACHE',
          value: 'CACHE',
        },
        {
          name: 'BCACHE',
          value: 'BCACHE',
        },
      ],
    },
    {
      blockcomment: 'Satellite connection statuses',
    },
    {
      name: 'ConnectionStatus',
      type: 'enum',
      enumtype: 'int',
      values: [
        {
          name: 'OFFLINE',
          value: 0,
        },
        {
          name: 'CONNECTED',
          value: 1,
        },
        {
          name: 'ONLINE',
          value: 2,
        },
        {
          name: 'VERSION_MISMATCH',
          value: 3,
        },
        {
          name: 'FULL_SYNC_FAILED',
          value: 4,
        },
        {
          name: 'AUTHENTICATION_ERROR',
          value: 5,
        },
        {
          name: 'UNKNOWN',
          value: 6,
        },
        {
          name: 'HOSTNAME_MISMATCH',
          value: 7,
        },
        {
          name: 'OTHER_CONTROLLER',
          value: 8,
        },
        {
          name: 'AUTHENTICATED',
          value: 9,
        },
        {
          name: 'NO_STLT_CONN',
          value: 10,
        },
        {
          name: 'MISSING_EXT_TOOLS',
          value: 11,
        },
        {
          name: 'DUPLICATE_UNAME',
          value: 12,
        },
      ],
    },
    {
      blockcomment: 'Clone states',
    },
    {
      name: 'CloneStatus',
      type: 'enum',
      enumtype: 'string',
      values: [
        {
          name: 'FAILED',
          value: 'FAILED',
        },
        {
          name: 'CLONING',
          value: 'CLONING',
        },
        {
          name: 'COMPLETE',
          value: 'COMPLETE',
        },
      ],
    },
    {
      blockcomment: 'Default names',
    },
    {
      name: 'DEFAULT_NETIF',
      value: 'default',
      type: 'string',
    },
    {
      name: 'DFLT_SNAPSHOT_SHIPPING_PREFIX',
      value: 'ship',
      type: 'string',
    },
    {
      blockcomment: 'Default values',
    },
    {
      name: 'DFLT_AUTO_SNAPSHOT_KEEP',
      value: '10',
      type: 'string',
    },
    {
      name: 'DFLT_SHIPPED_SNAPSHOT_KEEP',
      value: '10',
      type: 'string',
    },
  ],
};
