const NetInterface = {
  name: 'default',
  address: '10.10.10.10',
  satellite_port: 3366,
  satellite_encryption_type: 'Plain',
  is_active: true,
};

export type NetInterfaceType = typeof NetInterface;
