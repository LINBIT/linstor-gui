// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

const en = {
  common: {
    disconnected: 'DISCONNECTED',
    connected: 'CONNECTED',
    search: 'Search',
    property: 'Properties',
    add: 'Add',
    create: 'Create',
    view: 'View',
    edit: 'Edit',
    migrate: 'Migrate',
    delete: 'Delete',
    lost: 'Lost',
    nodes: 'Nodes',
    resources: 'Resources',
    volumes: 'Volumes',
    error_reports: 'Error Reports',
    disk_creation_records: 'Disk creation records',
    deploy: 'Deploy',
    submit: 'Submit',
    cancel: 'Cancel',
    snapshot: 'Snapshot',
    success: 'Success',
    reset: 'Reset',
    name: 'Name',
    action: 'Action',
    resource_group: 'Resource Group',
    controller: 'Controller',
    add_property: 'Add Property',
    controller_properties: 'Controller Properties',
    back: 'Back',
    activate: 'Set as active',
    detail: 'Detail',
    storage_pool: 'Storage Pool',
    node: 'Node',
    spawn: 'Spawn',
    spawn_on_create: 'Spawn on create',
    port: 'Port',
    size: 'Size',
    state: 'State',
    place_count: 'Place Count',
    diskless_on_remaining: 'Diskless on remaining',
    replication_mode: 'Replication Mode',
    async: 'Asynchronous(A)',
    semi_sync: 'Memory synchronous(B)',
    sync: 'Synchronous(C)',
    resource_definition: 'Resource Definition',
    volume_number: 'Volume Number',
    created_on: 'Created On',
    usage_status: 'Usage Status',
    connection_status: 'Connection Status',
    add_column: 'Add Column',
    column_data_index: 'Column Data Index',
    column_title: 'Column Title',
    reset_column: 'Reset Column',
    resource_definition_name: 'Resource Definition Name',
    allocate_method: 'Allocate Method',
    auto: 'Auto',
    manual: 'Manual',
    device_path: 'Device Path',
    resource: 'Resource',
    upload: 'Upload',
    save: 'Save',
    settings: 'Settings',
    status: 'Status',
    confirm: 'Confirm',
    stop: 'Stop',
    start: 'Start',
    starting: 'Starting...',
    stopping: 'Stopping...',
    deleting: 'Deleting...',
    logout: 'Logout',
    user: 'User',
    password: 'Password',
    login: 'Login',
    username: 'Username',
    logs: 'Logs',
    log_detail: 'Log Detail',
    clear_all_logs: 'Clear All Logs',
    mark_all_as_read: 'Mark All as Read',
    back_to_logs: 'Back to Logs',
    mark_as_read: 'Mark as Read',
    primary: 'Primary',
    adjust: 'Adjust',
    clone: 'Clone',
    external_name: 'External Name',
    use_zfs_clone: 'Use ZFS Clone',
    toggle: 'Toggle',
    layers: 'Layers',
    volume_definition: 'Volume Definition',
    volume_number_short: 'V#',
    keyword: 'Keyword',
    action_short: 'A',
    resource_definition_properties: 'Resource Definition Properties',
    volume_definition_properties: 'Volume Definition Properties',
  },
  menu: {
    dashboard: 'Dashboard',
    support: 'Support',
    inventory: 'Inventory',
    node: 'Nodes',
    controller: 'Controller',
    storage_pools: 'Storage Pools',
    error_reports: 'Error Reports',
    software_defined: 'Storage Configuration',
    resource_overview: 'Resource Overview',
    resource_groups: 'Resource Groups',
    resource_definitions: 'Resource Definitions',
    volume_definitions: 'Volume Definitions',
    resources: 'Resources',
    volumes: 'Volumes',
    node_ip_addrs: 'IP Addresses',
    remotes: 'Remote',
    linstor: 'LINSTOR',
    s3: 'S3',
    settings: 'Settings',
    gateway: 'Gateway',
    iscsi: 'iSCSI',
    nfs: 'NFS',
    'nvme-of': 'NVMe-oF',
    snapshot: 'Snapshots',
    grafana: 'Grafana',
    users: 'Users',
  },
  node: {
    node_list: 'Node List',
    node_name: 'Name',
    default_ip: 'IP',
    default_port: 'Port',
    node_type: 'Type',
    node_status: 'Status',
    node_detail: 'Node Detail',
    create_node: 'Create Node',
    edit_node: 'Edit Node',
  },
  node_detail: {
    title: 'Node Detail',
    node_name: 'Node name',
    node_type: 'Node type',
    node_status: 'Node status',
    resource_layers: 'Resource layers',
    storage_providers: 'Storage providers',
    network_interfaces: 'Network interfaces',
    storage_pool_info: 'Storage pool info',
    resource_info: 'Resource info',
    add_network_interface: 'Add Network Interface',
  },
  storage_pool: {
    list: 'Storage Pool List',
    name: 'Name',
    node_name: 'Node Name',
    network_preference: 'Network Preference',
    disk: 'Disk',
    provider_kind: 'Provider Kind',
    capacity: 'Capacity',
    free_capacity: 'Free Capacity',
    total_capacity: 'Total Capacity',
    supports_snapshots: 'Supports Snapshots',
    show_default: 'Show Default',
    add_title: 'Add Storage Pool',
    add_description:
      'A storage pool identifies physically-backed storage that LINSTOR storage volumes consume. You can assign a storage pool to other LINSTOR objects, such as LINSTOR resources, resource definitions, or resource groups. LINSTOR storage volumes created from these objects will consume physical storage from the storage pool assigned to the object.',
    new_device: 'New Device',
    new_device_description: 'When creating storage pool using new device, please make sure the device is empty.',
    existing_device: 'Existing Device',
    existing_device_description:
      'To use an existing device, first create a volume group and logical volume by using LVM CLI commands.',
    storage_pool_name: 'Storage Pool Name',
    node: 'Node',
    type: 'Type',
    lvm_pool: 'Volume Group/Thin Pool',
    zfs_pool: 'Pool Name',
    zfs_toast: 'You need to install and configure ZFS on the node before creating a ZFS storage pool.',
    multiple_nodes: 'Multiple Nodes',
    device_path: 'Device Path',
    device_path_tooltip:
      'Select the path of the physical device that will back the storage pool. The device should be empty.',
    advanced_options: 'Advanced Options',
    lvm_pool_name: 'LVM Pool Name',
    sed: 'SED Enabled',
    vdo: 'VDO Enabled',
    zfs_pool_name: 'ZFS Pool Name',
  },
  ip_address: {
    list: 'IP Addresses List',
    node: 'Node',
    ip_address: 'IP Address',
    tcp_port: 'TCP Port',
    alias: 'Alias',
    is_management_network: 'Active',
  },
  error_report: {
    id: 'ID',
    time: 'Time',
    module: 'Module',
    content: 'Content',
    detail_title: 'Error Report Detail',
    list_title: 'Error Report List',
    download_sos: 'Download SOS Report',
    time_range: 'Time Range',
  },
  dashboard: {
    title: 'Dashboard',
  },
  resource_group: {
    list: 'Resource Group List',
    name: 'Resource Group Name',
    place_count: 'Place Count',
    storage_pools: 'Storage Pool(s)',
    replication: 'Replication Mode',
    auto: 'Auto',
    async: 'Asynchronous(A)',
    semi_sync: 'Memory synchronous(B)',
    sync: 'Synchronous(C)',
    diskless: 'Diskless on remaining',
    description: 'Description',
    create: 'Create Resource Group',
    storage_providers: 'Storage Providers',
    linstor_layers: 'LINSTOR Layers',
    drbd_protocol: 'DRBD Protocol',
    spawn_on_create: 'Spawn on create',
    storage_pool: 'Storage Pool',
    show_advanced: 'Show advanced setting',
    hide_advanced: 'Hide advanced settings',
    replicas_on_same: 'Replicas On Same',
    do_not_place_with: 'Do Not Place With',
    replicas_on_different: 'Replicas On Different',
    do_not_place_with_regex: 'Do Not Place With Regex',
  },
  resource_definition: {
    name: 'Name',
    list: 'Resource Definition List',
    resource_group_name: 'Resource Group Name',
    size: 'Size',
    port: 'Port',
    state: 'State',
    create: 'Create Resource Definition',
    edit: 'Edit Resource Definition',
  },
  volume_definition: {
    name: 'Name',
    list: 'Volume Definition List',
    resource_group_name: 'Resource Group Name',
    create: 'Create Volume Definition',
  },
  resource: {
    list: 'Resource List',
    overview: 'Resource Overview',
    create: 'Create Resource',
    edit: 'Edit Resource',
    create_snapshot: 'Create Snapshot',
    migrate: 'Migrate Resource',
    resource: 'Resource',
    from: 'From Node',
    to: 'To Node',
    connection_status: 'Connections',
    add_disk: 'Add Disk',
    remove_disk: 'Remove Disk',
    search_placeholder: 'Search by resource name or aux property value',
  },
  volume: {
    list: 'Volume List',
    device_name: 'Device Name',
    allocated: 'Allocated',
    in_use: 'In Use',
    allocated_size: 'Allocated Size',
    reserved_size: 'Reserved Size',
    resource_volume: 'Resource/VolumeNumber',
  },
  controller: {
    controller_detail: 'Controller Detail',
  },
  // Remote / Linstor
  linstor: {
    list: 'LINSTOR List',
  },
  iscsi: {
    list: 'iSCSI List',
    create: 'iSCSI Create',
    iqn: 'IQN',
    resource_group: 'Resource Group',
    service_ips: 'Service IP',
    on_node: 'On Node',
    linstor_state: 'LINSTOR State',
    service_state: 'Service State',
    lun: 'LUN',
    add_volume: 'Add Volume',
    delete_volume: 'Delete Volume',
    adding_volume: 'Adding Volume',
    deleting_volume: 'Deleting Volume',
    add_service_ip: 'Add Service IP',
  },
  nfs: {
    list: 'NFS List',
    create: 'NFS Create',
    name: 'Name',
    size: 'Size',
    service_ip: 'Service IP',
    on_node: 'On Node',
    export_path: 'Export Path',
    linstor_state: 'LINSTOR State',
    service_state: 'Service State',
    file_system: 'File System',
    volumes: 'Volumes',
    allowed_ips: 'Allowed IPs',
  },
  nvme: {
    list: 'NVMe-oF List',
    nqn: 'NQN',
    create: 'NVMe-oF Create',
    resource_group: 'Resource Group',
    service_ips: 'Service IP',
    on_node: 'On Node',
    linstor_state: 'LINSTOR State',
    service_state: 'Service State',
    lun: 'LUN',
    add_volume: 'Add Volume',
    delete_volume: 'Delete Volume',
    adding_volume: 'Adding Volume',
    deleting_volume: 'Deleting Volume',
    add_service_ip: 'Add Service IP',
  },
  snapshot: {
    list: 'Snapshot List',
    resource_name: 'Resource Name',
    node_names: 'Node Names',
    snapshot_name: 'Snapshot Name',
    volumes: 'Volumes',
    create: 'Create Snapshot',
    nodes: 'Nodes',
  },
  users: {
    description: 'You can enable or disable user authentication from here.',
    authentication: 'User authentication',
    no_user: 'There are no users created yet.',
    add_a_user: 'Add a user',
    reset_password: 'Reset password',
    delete_user: 'Delete user',
    new_password: 'New password',
    confirm_password: 'Confirm password',
    change_password: 'Change password',
    current_password: 'Current password',
    username: 'Username',
    password: 'Password',
    add: 'Add',
    password_changed: 'Password changed successfully',
  },
  remote: {
    list: 'Remote List',
    name: 'Name',
    type: 'Type',
    Info: 'Info',
    backups: 'Backups',
    endpoint: 'Endpoint',
    bucket: 'Bucket',
    region: 'Region',
    access_key: 'Access Key',
    secret_key: 'Secret Key',
    url: 'URL',
    use_path_style: 'Use Path Style',
  },
  settings: {
    title: 'Settings',
    general: 'General',
    custom_logo: 'Custom Logo',
    custom_logo_description:
      'You can select either a local SVG file or a remote URL. The URL can point to any image type.',
    logo: 'Logo',
    url: 'URL',
    gateway: 'Gateway',
    linstor_gateway: 'LINSTOR Gateway',
    linstor_gateway_description:
      'Manages Highly-Available iSCSI targets and NFS exports via LINSTOR. Installing linstor-gateway is a prerequisite for enabling this feature. After enabling this feature, the Gateway entry will be displayed in the left-side menu.',
    passphrase: 'Passphrase',
    gateway_mode: 'Gateway Mode',
    gateway_mode_description:
      'Installing linstor-gateway is a prerequisite for enabling this feature. And ensure that the endpoint is correctly configured to allow communication between the LINSTOR Gateway and the LINSTOR Server.',
    custom_host: 'Custom Host',
    custom_host_description:
      "When the custom host is enabled, you need to enter the LINSTOR Gateway API endpoints in the 'Custom API' section below. The default value is the LINSTOR server IP + 8080, like http://192.168.1.1:8080/. If a custom port or different IP is used, adjust the endpoint accordingly.",
    custom_api: 'Custom API',
    grafana: 'Grafana',
    grafana_dashboard: 'Grafana Dashboard',
    grafana_description:
      'Here you can configure the Grafana Dashboard. Once set up, an entry will be displayed in the left-side menu.',
    grafana_url: 'Grafana URL',
    available: 'Available',
    not_available: 'Not Available',
    linstor_passphrase: 'LINSTOR Passphrase',
    create_edit_label: 'Create/Edit',
    old_passphrase: 'Old Passphrase',
    new_passphrase: 'New Passphrase',
    confirm_passphrase: 'Confirm Passphrase',
  },
  about: {
    linstor_version: 'LINSTOR VERSION',
    ui_version: 'UI Version',
    controller_ip: 'Controller Binding IP',
    controller_active_on: 'Controller Active On',
    trademark:
      'LINSTOR-GUI is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3 of the License. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.',
  },
};

export default en;
