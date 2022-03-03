const alert = {
  ret_code: -4611686018406678318,
  message: 'Failed to parse IP address',
  cause: 'The specified IP address is not valid\nasd',
  correction: 'Specify a valid IPv4 or IPv6 address.',
  details: "The specified input 'asd' is not a valid IP address.\nNode: ds",
  error_report_ids: ['621F3D8F-00000-000017'],
  obj_refs: { Node: 'ds' },
};

export type AlertType = typeof alert;
