declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.css';
declare module '*.wav';
declare module '*.mp3';
declare module '*.m4a';
declare module '*.rdf';
declare module '*.ttl';
declare module '*.pdf';

const resErrorData = {
  ret_code: -4611686018406678500,
  message: "The given node name 'node_name' is invalid.",
  cause: "Domain name cannot contain character '_'",
  details: 'Node: node_name',
  error_report_ids: ['6156AB3B-00000-000030'],
  obj_refs: { Node: 'node_name' },
};

type resError = typeof resErrorData;
type alertList = Array<{ title: string; variant: string; key: string }>;
type SelectOptions = Array<{ value: string; label: string; isDisabled: boolean; isPlaceholder?: boolean }>;
