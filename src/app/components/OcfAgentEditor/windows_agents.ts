// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/generate-windows-agents.mjs
// Source: scripts/ocf-windows-agents/*.json, produced by ocf-resource-agents-rust 'make json-files'.
//
// The source JSON carries no 'unique' flag and no parameter defaults, so
// neither appears here.
export const windowsAgents = {
  providers: {
    linbit: [
      {
        name: 'DRBD',
        shortdesc: 'Resource agent for DRBD',
        longdesc: 'This resource agent manages a single DRBD resource.',
        parameters: [
          {
            name: 'drbd_resource',
            required: true,
            shortdesc: 'Name of the DRBD resource to manage.',
            longdesc: 'Name of the DRBD resource to manage.',
            type: 'string',
          },
        ],
        actions: [
          {
            name: 'start',
            timeout: '20',
          },
          {
            name: 'stop',
            timeout: '20',
          },
          {
            name: 'promote',
            timeout: '20',
          },
          {
            name: 'demote',
            timeout: '20',
          },
          {
            name: 'monitor',
            timeout: '20',
            interval: '10',
            depth: '0',
          },
          {
            name: 'describe',
            timeout: '5',
          },
          {
            name: 'meta-data',
            timeout: '5',
          },
        ],
      },
      {
        name: 'Filesystem',
        shortdesc: 'Resource agent for WinDRBD filesystem mounts',
        longdesc:
          'This resource agent manages the online/read-only state of a WinDRBD\ndisk and assigns a mountpoint (drive letter or path) to one of its\npartitions. It does not initialize, format, or partition the disk.',
        parameters: [
          {
            name: 'device',
            required: true,
            shortdesc: 'DRBD device path (e.g. /dev/drbd0 or /dev/drbd0p2)',
            longdesc:
              'The DRBD device path used to identify the WinDRBD disk, e.g.\n/dev/drbd0 or /dev/drbd0p2 for partition 2. The minor number\nis extracted from this path.',
            type: 'string',
          },
          {
            name: 'directory',
            required: true,
            shortdesc: 'Mount point (drive letter or path)',
            longdesc: 'The mount point where the partition should be assigned, e.g.\nD: or C:\\ClusterData.',
            type: 'string',
          },
          {
            name: 'hyper_v',
            required: false,
            shortdesc: 'Skip clearing read-only flag (for Hyper-V shared storage)',
            longdesc:
              'If set to true, the read-only attribute of the disk will not be\ncleared on start. This is needed when the disk is used as Hyper-V\nshared storage managed by the HyperV resource agent.',
            type: 'boolean',
          },
        ],
        actions: [
          {
            name: 'start',
            timeout: '20',
          },
          {
            name: 'stop',
            timeout: '20',
          },
          {
            name: 'monitor',
            timeout: '20',
            interval: '10',
            depth: '0',
          },
          {
            name: 'describe',
            timeout: '5',
          },
          {
            name: 'meta-data',
            timeout: '5',
          },
        ],
      },
      {
        name: 'guard',
        shortdesc: 'Resource agent that masks a chain of resources.',
        longdesc:
          'This is a resource agent that allows masking of\nother resources. It checks some condition and returns\nan error code on start / promote and monitor if the\ncondition is set. The condition can be set and reset with\nthe (non-OCF-conformant) mask / unmask actions.',
        parameters: [
          {
            name: 'token',
            required: true,
            shortdesc: 'Identifier',
            longdesc: 'A name that identifies the mask, so we can have\nmultiple chains with different mask values.',
            type: 'string',
          },
        ],
        actions: [
          {
            name: 'start',
            timeout: '20',
          },
          {
            name: 'stop',
            timeout: '20',
          },
          {
            name: 'monitor',
            timeout: '20',
            interval: '0',
            depth: '0',
          },
          {
            name: 'meta-data',
            timeout: '5',
          },
          {
            name: 'mask',
            timeout: '5',
          },
          {
            name: 'unmask',
            timeout: '5',
          },
          {
            name: 'describe',
            timeout: '5',
          },
        ],
      },
      {
        name: 'HyperV',
        shortdesc: 'Resource agent for Hyper-V virtual machines',
        longdesc:
          'This resource agent manages a Hyper-V virtual machine. On start it\nwaits for a live migration to complete or imports the VM from its\nconfiguration files on the shared SMB storage if no migration\noccurred. On stop it suspends the VM so it can be resumed or\nmigrated to another node. It also supports live migration via\nmigrate_to and tracks which node last ran the VM so that failover\nafter a node crash can be handled correctly.',
        parameters: [
          {
            name: 'name',
            required: true,
            shortdesc: 'Name of the Hyper-V VM',
            longdesc: 'The name of the Hyper-V virtual machine to manage.',
            type: 'string',
          },
          {
            name: 'metadata_path',
            required: true,
            shortdesc: 'UNC path to VM configuration SMB share',
            longdesc:
              'The UNC path to the SMB share that contains the VM configuration\nfiles (the "Virtual Machines" subdirectory). The share is typically\nserved by a windows_share resource agent using the cluster service\nIP, e.g. \\\\10.43.208.123\\hyper-v-metadata. A vm-state.json file\ntracking the VM GUID and last known node is also stored here.',
            type: 'string',
          },
          {
            name: 'vhd_path',
            required: true,
            shortdesc: 'Path to VHD/VHDX disk image files',
            longdesc:
              'The path to the directory where the VHD/VHDX disk image files are\nstored. This is used as the destination when importing the VM after\na failover.',
            type: 'string',
          },
          {
            name: 'node',
            required: false,
            shortdesc: 'Target node for live migration (set by DRBD reactor)',
            longdesc:
              'The name of the target node to migrate the VM to when the\nmigrate_to action is invoked. This parameter is set automatically\nby the DRBD reactor promoter plugin and does not need to be\nspecified by the user.',
            type: 'string',
          },
          {
            name: 'lost_node',
            required: false,
            shortdesc: 'Lost cluster node name (set by DRBD reactor)',
            longdesc:
              'The name of a cluster node that has been declared lost (e.g. it\ncrashed or lost network connectivity). This parameter is set\nautomatically by the DRBD reactor promoter plugin and does not\nneed to be specified by the user. It allows the agent to mark\nthat node as unavailable in the VM state cache, enabling faster\nfailover.',
            type: 'string',
          },
        ],
        actions: [
          {
            name: 'start',
            timeout: '120',
          },
          {
            name: 'stop',
            timeout: '20',
          },
          {
            name: 'monitor',
            timeout: '20',
            interval: '10',
            depth: '0',
          },
          {
            name: 'describe',
            timeout: '5',
          },
          {
            name: 'meta-data',
            timeout: '5',
          },
          {
            name: 'migrate_to',
            timeout: '120',
          },
          {
            name: 'node-lost',
            timeout: '5',
          },
        ],
      },
      {
        name: 'ipaddr2-windows',
        shortdesc: 'Resource agent for controlling an IPv4 cluster IP address',
        longdesc:
          'Resource agent for controlling an IPv4 cluster IP address.\nIt uses the netsh utility to add and remove the IP\naddress. It uses the ipconfig tool to check if the\nIP address is configured and up and running.',
        parameters: [
          {
            name: 'ip',
            required: true,
            shortdesc: 'The IPv4 cluster IP address.',
            longdesc: 'The IPv4 cluster IP address. Example: 10.43.224.99.',
            type: 'string',
          },
          {
            name: 'nic',
            required: true,
            shortdesc: 'The network interface for the IP address',
            longdesc:
              'The network interface where this cluster IP should be bound\nto. Example: "Ethernet Instance 0". This must match exactly\nthe Name of the network interface (which might be longer).',
            type: 'string',
          },
          {
            name: 'cidr_netmask',
            required: false,
            shortdesc: 'Network prefix length in CIDR notation (e.g. 24)',
            longdesc:
              "The network prefix length in CIDR notation, e.g. 24 for a /24\n(255.255.255.0) network. If not specified, the netsh command will\nuse the interface's existing subnet mask.",
            type: 'integer',
          },
        ],
        actions: [
          {
            name: 'start',
            timeout: '20',
          },
          {
            name: 'stop',
            timeout: '20',
          },
          {
            name: 'monitor',
            timeout: '20',
            interval: '10',
            depth: '0',
          },
          {
            name: 'describe',
            timeout: '5',
          },
          {
            name: 'meta-data',
            timeout: '5',
          },
        ],
      },
      {
        name: 'mssql_server_attach_database',
        shortdesc: 'Resource agent for attaching MS SQL Server databases',
        longdesc:
          'This resource agent attaches Microsoft SQL Server databases to a\nrunning SQL Server instance. On start it scans a directory for\ndatabase primary files (by default *.mdf) and issues a CREATE\nDATABASE ... FOR ATTACH statement for each one found via sqlcmd.\nOn stop it does nothing; databases are detached automatically when\nthe SQL Server service stops.',
        parameters: [
          {
            name: 'directory',
            required: true,
            shortdesc: 'Directory containing the database files',
            longdesc: 'The directory to scan for database files. Subdirectories are not\nsearched recursively.',
            type: 'string',
          },
          {
            name: 'pattern',
            required: false,
            shortdesc: 'Glob pattern for database files (default: *.mdf)',
            longdesc:
              'Glob pattern used to match database primary files inside the\ndirectory. Defaults to *.mdf. The matching is case-insensitive.',
            type: 'string',
          },
        ],
        actions: [
          {
            name: 'start',
            timeout: '20',
          },
          {
            name: 'stop',
            timeout: '20',
          },
          {
            name: 'monitor',
            timeout: '20',
            interval: '0',
            depth: '0',
          },
          {
            name: 'describe',
            timeout: '5',
          },
          {
            name: 'meta-data',
            timeout: '5',
          },
        ],
      },
      {
        name: 'windows_service',
        shortdesc: 'Resource agent for Windows Services',
        longdesc:
          'This resource agent controls a Windows Service. It uses\n  the net utility for starting and stopping, and the sc\n  utility for monitoring.',
        parameters: [
          {
            name: 'service_name',
            required: true,
            shortdesc: 'Windows Service name',
            longdesc: 'The name of the Windows Service. Example would be MSSQLSERVER or MSSQL$MSSQLSERVER02.',
            type: 'string',
          },
        ],
        actions: [
          {
            name: 'start',
            timeout: '20',
          },
          {
            name: 'stop',
            timeout: '20',
          },
          {
            name: 'monitor',
            timeout: '20',
            interval: '10',
            depth: '0',
          },
          {
            name: 'describe',
            timeout: '5',
          },
          {
            name: 'meta-data',
            timeout: '5',
          },
        ],
      },
      {
        name: 'windows_share',
        shortdesc: 'Resource agent for Windows network shares',
        longdesc:
          'This resource agent manages a Windows network share using the\nnet share command. On start it creates the share if it does not\nalready exist. On stop it removes the share.',
        parameters: [
          {
            name: 'directory',
            required: true,
            shortdesc: 'The local directory to share',
            longdesc: 'The local directory path to expose as a network share,\ne.g. D:\\SharedData.',
            type: 'string',
          },
          {
            name: 'sharename',
            required: true,
            shortdesc: 'The network share name',
            longdesc: 'The name of the network share as it will appear on the network,\ne.g. SharedData.',
            type: 'string',
          },
          {
            name: 'grant',
            required: false,
            shortdesc: 'Access permissions (/GRANT:user,permission)',
            longdesc:
              'Optional access permissions passed as the /GRANT argument to\nnet share. Format is user,permission, e.g. Administrator,FULL\nor Everyone,READ. If not specified, default Windows share\npermissions apply.',
            type: 'string',
          },
        ],
        actions: [
          {
            name: 'start',
            timeout: '20',
          },
          {
            name: 'stop',
            timeout: '20',
          },
          {
            name: 'monitor',
            timeout: '20',
            interval: '10',
            depth: '0',
          },
          {
            name: 'describe',
            timeout: '5',
          },
          {
            name: 'meta-data',
            timeout: '5',
          },
        ],
      },
    ],
  },
} as const;
