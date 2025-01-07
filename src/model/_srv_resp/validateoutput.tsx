// def ParseSchema(Schema)
//   if s.type == obj:
//     assert ...

//   handleDictSchema(s.prop)
//   for plugin in Plugins:
//       schema = plugin(schema)

// def DictOfSchemaHandler(Dict):
//   for schema in Dict:

//     handleSchema(schema)

//     // if isAllowed(schema):
//     //   continue;
//     // schema = plugin1(schema)
//     // schema = plugin2(...)

// Plugins:
//   isAllowed: boolean
//   enrichSchema: Schema

// Schema = {
//   type: string
//   required : string[]
//   if : Schema
//   ...
//   properties: DictOfSchema
// }

// DictOfSchema = {
//   ...Schema
// }

export const validateReturnMsg = {
  json_schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'system_type',
      'bootstrap_os',
      'users_ou',
      // "bootstrap_disk"
    ],
    properties: {
      bootstrap_os: {
        title: 'Operating System Installer',
        description: 'Hallo Welt',
        type: 'string',
        oneOf: [
          {
            const: 'redhat-9',
            title: 'Red Hat Enterprise Linux 9',
          },
          {
            const: 'ubuntu-22.04',
            title: 'Ubuntu 22.04 LTS',
          },
          {
            const: 'ubuntu-23.10',
            title: 'Ubuntu 23.10 Beta',
          },
          {
            const: 'windows-11',
            title: 'Windows 11 Education',
          },
        ],
      },
      system_type: {
        title: 'System Type',
        type: 'string',
        oneOf: [
          {
            const: 'desktop',
            title: 'Desktop',
          },
          {
            const: 'laptop',
            title: 'Laptop',
          },
          {
            const: 'server',
            title: 'Server',
          },
        ],
        default: 'desktop',
      },
      users_ou: {
        title: 'Group',
        type: 'string',
        oneOf: [
          {
            const: 'empty',
            title: 'empty',
          },
        ],
      },
      users_subou: {
        title: 'Subgroup',
        type: 'string',
        oneOf: [
          {
            const: 'staff',
            title: 'Staff',
          },
          {
            const: 'stud',
            title: 'Students',
          },
          {
            const: 'guest',
            title: 'Guests',
          },
          {
            const: 'all',
            title: 'All',
          },
        ],
        default: 'all',
      },
      users_root: {
        title: 'Users (root)',
        description:
          'Will be able to log in on the machine and have root/Administrator privileges.',
        type: 'array',
        items: {
          enum: ['root'],
        },
        default: ['root'],
      },
      users_regular: {
        title: 'Users (regular)',
        description:
          'Will be able to log in on the machine but have **no** root/Administrator privileges.',
        type: 'array',
        items: {
          enum: ['baumanmo', 'mamanuel', 'kopovoia', 'walteste', 'dbakker'],
        },
        default: ['gdangeli-test'],
      },
      users_restrict_login: {
        title: 'Restrict Login',
        type: 'boolean',
        default: true,
      },
      bootstrap_flavour_ubuntu: {
        title: 'Desktop Environment',
        type: 'string',
        oneOf: [
          {
            const: 'lubuntu-desktop',
            title: 'Lubuntu (LXDE)',
          },
          {
            const: 'ubuntu-desktop',
            title: 'Ubuntu (GNOME)',
          },
          {
            const: 'ubuntu-budgie-desktop',
            title: 'Ubuntu Budgie',
          },
          {
            const: 'ubuntu-mate-desktop',
            title: 'Ubuntu MATE',
          },
          {
            const: 'xubuntu-desktop',
            title: 'Xubuntu (Xfce)',
          },
        ],
        default: 'ubuntu-desktop',
      },
      bootstrap_software_windows: {
        title: 'Software Package List',
        type: 'string',
        oneOf: [
          {
            const: 'INFK-Students-Standard',
            title: 'Student',
          },
          {
            const: 'INFK-Department-Standard',
            title: 'Staff',
          },
          {
            const: 'INFK-AV-Only',
            title: 'Antivirus only',
          },
          {
            const: 'INFK-empty-Standard',
            title: 'empty Standard',
          },
        ],
        default: 'INFK-AV-Only',
      },
      packages_manual_ubuntu: {
        title: 'Software Packages',
        type: 'array',
        items: {
          oneOf: [
            {
              const: 'cuda-11',
              title: 'CUDA 11',
            },
            {
              const: 'cuda-12',
              title: 'CUDA 12',
            },
            {
              const: 'matlab-2021b',
              title: 'MatLab 2021b',
            },
          ],
        },
      },
      bootstrap_disk: {
        title: 'Install Disk',
        type: 'string',
        pattern: '^([a-z0-9]{3,10}|)$',
        description:
          'Allows the user to set the disk on which the operating system is to be installed.',
      },
      users_local_home: {
        title: 'Local Home',
        type: 'boolean',
        default: false,
      },
      monitoring_enabled: {
        title: 'Monitoring',
        type: 'boolean',
        default: false,
      },
      monitoring_services_common: {
        title: 'Services',
        type: 'array',
        items: {
          oneOf: [
            {
              const: 'load',
              title: 'CPU load',
            },
            {
              const: 'procs',
              title: 'Process count',
            },
            {
              const: 'disk',
              title: 'Disk usage',
            },
            {
              const: 'memory',
              title: 'Memory usage',
            },
            {
              const: 'ssh',
              title: 'SSH availability',
            },
            {
              const: 'swap',
              title: 'SWAP usage',
            },
            {
              const: 'http',
              title: 'HTTP availability',
            },
            {
              const: 'docker',
              title: 'Docker container state',
            },
            {
              const: 'swarm',
              title: 'Docker swarm state',
            },
          ],
        },
        default: ['load', 'procs', 'disk', 'memory', 'ssh'],
      },
      monitoring_service_http: {
        title: 'Service HTTP',
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'http_ssl'],
          properties: {
            name: {
              title: 'Service Name',
              type: 'string',
              pattern: '^[a-zA-Z0-9.-]+$',
              default: 'https',
            },
            http_ssl: {
              title: 'SSL',
              description: 'Test on port 443 instead of 80 and verify SSL certificate',
              type: 'boolean',
              default: true,
            },
            http_vhost: {
              title: 'Host name',
              type: 'string',
              pattern: '^[a-zA-Z0-9.-]+$',
            },
          },
          if: {
            properties: {
              http_ssl: {
                const: true,
              },
            },
          },
          then: {
            properties: {
              http_certificate: {
                title: 'Certificate',
                description: 'Number of days before certificate expires (Critical,Warning)',
                type: 'string',
                pattern: '^[0-9]+,[0-9]+$',
                default: '30,20',
              },
            },
          },
        },
      },
      monitoring_notification_mail: {
        type: 'object',
        additionalProperties: false,
        required: ['interval', 'period'],
        properties: {
          interval: {
            title: 'Mail Interval',
            oneOf: [
              {
                const: '0',
                title: 'Only on event',
              },
              {
                const: '30m',
                title: 'On event and every 30 minutes',
              },
              {
                const: '1h',
                title: 'On event and every hour',
              },
              {
                const: '2h',
                title: 'On event and every 2 hours',
              },
              {
                const: '8h',
                title: 'On event and every 8 hours',
              },
              {
                const: '12h',
                title: 'On event and every 12 hours',
              },
              {
                const: '24h',
                title: 'On event and every 24 hours',
              },
            ],
            default: '30m',
          },
          period: {
            title: 'When to notify',
            enum: ['24x7', '9to5', 'never'],
            default: '24x7',
          },
        },
      },
      desktop_notify_reboot_hours: {
        title: 'Graphical Reboot Notification',
        description: 'Notify in GUI every N hours about a pending reboot due to updates',
        type: 'integer',
        minimum: 1,
        maximum: 168,
        default: 3,
      },
    },
  },
  ui_schema: {
    type: 'Categorization',
    elements: [
      {
        type: 'Category',
        label: 'Base',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/bootstrap_os',
          },
        ],
      },
      {
        type: 'Category',
        label: 'Users',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/users_ou',
          },
          {
            type: 'Control',
            scope: '#/properties/users_subou',
          },
          {
            type: 'Control',
            scope: '#/properties/users_root',
          },
          {
            type: 'Control',
            scope: '#/properties/users_regular',
          },
          {
            type: 'Control',
            scope: '#/properties/users_restrict_login',
          },
        ],
      },
      {
        type: 'Category',
        label: 'Advanced',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/bootstrap_software_windows',
          },
          {
            type: 'Control',
            scope: '#/properties/packages_manual_ubuntu',
          },
        ],
      },
      {
        type: 'Category',
        label: 'Expert',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/bootstrap_disk',
            options: {
              hello: 'this',
            },
          },
          {
            type: 'Control',
            scope: '#/properties/users_local_home',
          },
          {
            type: 'Control',
            scope: '#/properties/desktop_notify_reboot_hours',
          },
        ],
      },
      {
        type: 'Category',
        label: 'Monitoring',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/monitoring_services_common',
          },
        ],
      },
      {
        type: 'Category',
        label: 'Monitoring Services',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/monitoring_service_http',
          },
        ],
      },
      {
        type: 'Category',
        label: 'Monitoring Notification',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/monitoring_notification_mail/properties/interval',
            options: {
              // TODO; Can remove this again...
              autocomplete: false,
            },
          },
          {
            type: 'Control',
            scope: '#/properties/monitoring_notification_mail/properties/period',
          },
        ],
      },
    ],
  },
  data: {
    bootstrap_os: 'ubuntu-22.04',
    system_type: 'server',
    users_ou: 'empty',
    users_subou: 'guest',
    bootstrap_disk: 'hello world',
  },
  valid: true,
  detail: '',
};
