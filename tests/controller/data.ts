export const VALIDATE_01_RESPONSE_VALID = {
  schemas: {
    json_schema: {
      type: 'object',
      properties: {
        system_type: {
          title: 'System Type',
          type: 'string',
          enum: ['desktop', 'headless'],
          default: 'desktop',
        },
        professor: { title: 'Select Professor', type: 'string', enum: ['msrl', 'pam'] },
        pam_mount_volumes: {
          type: 'array',
          title: 'Pam Mount Volumes (Headless)',
          default: [
            {
              fstype: 'auto',
              path: '/local/home/%(USER)',
              mountpoint: '/home/%(USER)',
              options: 'bind',
              uid: '1001-10000000000',
            },
          ],
          items: {
            type: 'object',
            properties: {
              fstype: { type: 'string', title: 'FS Type' },
              path: { type: 'string', title: 'Path' },
              mountpoint: { type: 'string', title: 'Mountpoint' },
              options: { type: 'string', title: 'Options' },
              uid: { type: 'string', title: 'UID' },
            },
            additionalProperties: false,
            required: ['fstype', 'path', 'mountpoint', 'options', 'uid'],
          },
        },
        gnome_default_favorite_apps: {
          type: 'array',
          maxItems: 100,
          minItems: 0,
          uniqueItems: true,
          items: { type: 'string' },
          title: 'Gnome Apps (Desktop)',
          default: [],
        },
        inventory_groups: {
          title: 'Groups',
          type: 'array',
          items: {
            type: 'string',
            enum: ['all', 'desktop', 'headless', 'niggis_test2', 'noble', 'test-fuer-giuliano'],
          },
          default: ['all'],
        },
        host_description: {
          title: 'Host Description',
          type: 'string',
          pattern: '^[a-zA-Z0-9\\.,#@\\-_ ]*$',
          minLength: 5,
          maxLength: 200,
        },
        host_owner: {
          title: 'Host Owner',
          type: 'string',
          format: 'email',
          default: 'infmsg+gdangeli-test@inf.ethz.ch',
        },
        physical_host: {
          title: 'Physical Host',
          description: 'Hypervisor for Virtual Machine\n',
          type: 'string',
          format: 'hostname',
        },
        mac_address: {
          title: 'MAC Address',
          type: 'string',
          pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
        },
        proxy_conf: { title: 'Configure Proxy Settings', type: 'boolean', default: false },
        proxy_custom: { type: 'string', title: 'Custom Proxy Server' },
        proxy_apt: { title: 'Configure Proxy Settings: Apt', type: 'boolean', default: false },
        vpn_conf: { title: 'VPN', type: 'boolean', default: false },
        ufw_conf: { title: 'Configure UFW-Firewall', type: 'boolean', default: false },
        ufw_enable_firewall: { title: 'Enable UFW-Firewall', type: 'boolean', default: true },
        ufw_eth_default_rules: {
          title: 'UFW-Firewall: ETH Default Rules',
          description: 'Create eth-internal zone for ETH-Networks and allow SSH for this zone.\n',
          type: 'boolean',
          default: true,
        },
        ufw_eth_default_zabbix: {
          title: 'UFW-Firewall: ETH Default Zabbix',
          description: 'port 10050 and protocol tcp for Zabbix Monitoring\n',
          type: 'boolean',
          default: false,
        },
        ufw_rules: {
          title: 'Additional UFW-Firewall Rules',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { title: 'Allow', const: 'allow', default: 'allow' },
              source: {
                title: 'Source Address',
                type: 'string',
                pattern:
                  '^((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\/([0-9]|[12]\\d|3[0-2])$',
              },
              port: { title: 'Port', type: 'integer', minimum: 1 },
            },
            additionalProperties: false,
            required: ['rule', 'source', 'port'],
          },
        },
        active_directory_conf: { title: 'Join Active Directory', type: 'boolean', default: false },
        active_directory_join_user: {
          title: 'Join User',
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+$',
        },
        active_directory_join_passwd: {
          title: 'Join User Password',
          type: 'string',
          pattern: '^.*(?=.{12,})(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!#$%&? "]).*$',
        },
        active_directory_sssd_default_shell: {
          title: 'default shell (defined in sssd)',
          description:
            'please ensure, that your prefered shell is installed & contact us, if your loved one is not present in the list',
          type: 'string',
          enum: ['/bin/bash', '/usr/bin/fish', '/usr/bin/tcsh', '/bin/ash', '/usr/bin/zsh'],
          default: '/bin/bash',
        },
      },
      additionalProperties: false,
      required: [
        'system_type',
        'professor',
        'pam_mount_volumes',
        'gnome_default_favorite_apps',
        'inventory_groups',
        'host_description',
        'host_owner',
        'mac_address',
        'proxy_conf',
        'proxy_apt',
        'vpn_conf',
        'ufw_conf',
        'ufw_enable_firewall',
        'ufw_eth_default_rules',
        'ufw_eth_default_zabbix',
        'active_directory_conf',
        'active_directory_join_user',
        'active_directory_join_passwd',
        'active_directory_sssd_default_shell',
      ],
    },
    ui_schema: {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'General',
          elements: [
            { type: 'Control', scope: '#/properties/system_type', options: {} },
            { type: 'Control', scope: '#/properties/professor', options: {} },
            { type: 'Control', scope: '#/properties/inventory_groups', options: {} },
            {
              type: 'Group',
              label: 'Info',
              elements: [
                {
                  type: 'Control',
                  scope: '#/properties/host_description',
                  options: {
                    initial: '#2131423 niklausk',
                    initial_editable: false,
                    renderer: 'text_area',
                    rows: 'test',
                  },
                },
                { type: 'Control', scope: '#/properties/host_owner', options: {} },
                { type: 'Control', scope: '#/properties/physical_host', options: {} },
              ],
            },
          ],
        },
        {
          type: 'Category',
          label: 'Dynamic Config',
          elements: [
            { type: 'Control', scope: '#/properties/pam_mount_volumes', options: {} },
            { type: 'Control', scope: '#/properties/gnome_default_favorite_apps', options: {} },
          ],
        },
        {
          type: 'Category',
          label: 'Network',
          elements: [
            { type: 'Control', scope: '#/properties/mac_address', options: {} },
            { type: 'Control', scope: '#/properties/proxy_conf', options: {} },
            {
              type: 'Control',
              scope: '#/properties/proxy_custom',
              options: { initial: 'proxy.ethz.ch:3128', initial_editable: true },
            },
            { type: 'Control', scope: '#/properties/proxy_apt', options: {} },
            { type: 'Control', scope: '#/properties/vpn_conf', options: {} },
            { type: 'Control', scope: '#/properties/ufw_conf', options: {} },
            { type: 'Control', scope: '#/properties/ufw_enable_firewall', options: {} },
            { type: 'Control', scope: '#/properties/ufw_eth_default_rules', options: {} },
            { type: 'Control', scope: '#/properties/ufw_eth_default_zabbix', options: {} },
            { type: 'Control', scope: '#/properties/ufw_rules', options: {} },
          ],
        },
        {
          type: 'Category',
          label: 'Accounts',
          elements: [
            { type: 'Control', scope: '#/properties/active_directory_conf', options: {} },
            { type: 'Control', scope: '#/properties/active_directory_join_user', options: {} },
            { type: 'Control', scope: '#/properties/active_directory_join_passwd', options: {} },
            {
              type: 'Control',
              scope: '#/properties/active_directory_sssd_default_shell',
              options: {},
            },
          ],
        },
      ],
    },
    data: {
      system_type: 'headless',
      pam_mount_volumes: [
        {
          fstype: 'nonauto22',
          path: '/local/home/%(USER)',
          mountpoint: '/home/%(USER)',
          options: 'bind',
          uid: '1001-10000000000',
        },
      ],
      gnome_default_favorite_apps: ['org.gnome.Nautilus.desktop'],
      inventory_groups: ['all'],
      host_owner: 'infmsg+somename-test@inf.ethz.ch',
      proxy_conf: true,
      vpn_conf: false,
      ufw_conf: true,
      active_directory_conf: true,
      professor: 'msrl',
      host_description: '#233377',
      mac_address: '12-12-12-12-12-21',
      active_directory_sssd_default_shell: '/bin/bash',
      active_directory_join_user: 'user',
      active_directory_join_passwd: 'password12&u',
      proxy_apt: true,
      ufw_enable_firewall: true,
      ufw_eth_default_rules: true,
      ufw_eth_default_zabbix: true,
    },
    valid: true,
    message: null,
    validator: '',
    json_schema_loc: '',
    data_loc: '',
  },
  request: { valid: true, message: null },
};

export const VALIDATE_01_NAME = 'a-efef';

export const VALIDATE_01_ACTIONS = [];
export const VALIDATE_01_OPERATION = 'change';
export const VALIDATE_01_NEWYAML =
  '---\n# Automatically generated by VAYS\n\nsystem_type: headless\npam_mount_volumes:\n  - fstype: nonauto22\n    path: /local/home/%(USER)\n    mountpoint: /home/%(USER)\n    options: bind\n    uid: 1001-10000000000\ngnome_default_favorite_apps:\n  - org.gnome.Nautilus.desktop\ninventory_groups:\n  - all\nhost_owner: infmsg+somename-test@inf.ethz.ch\nproxy_conf: true\nvpn_conf: false\nufw_conf: true\nactive_directory_conf: true\nprofessor: msrl\nhost_description: "#233377"\nmac_address: 12-12-12-12-12-21\nactive_directory_sssd_default_shell: /bin/bash\nactive_directory_join_user: user\nactive_directory_join_passwd: password12&u\nproxy_apt: true\nufw_enable_firewall: true\nufw_eth_default_rules: true\nufw_eth_default_zabbix: true\n\n';
export const VALIDATE_01_REQUEST = {
  operation: 'change',
  type: 'host',
  actions: [],
  name: 'a-efef',
  entity: {
    name: 'a-efef',
    yaml_new:
      '---\n# Automatically generated by VAYS\n\nsystem_type: headless\npam_mount_volumes:\n  - fstype: nonauto22\n    path: /local/home/%(USER)\n    mountpoint: /home/%(USER)\n    options: bind\n    uid: 1001-10000000000\ngnome_default_favorite_apps:\n  - org.gnome.Nautilus.desktop\ninventory_groups:\n  - all\nhost_owner: infmsg+somename-test@inf.ethz.ch\nproxy_conf: true\nvpn_conf: false\nufw_conf: true\nactive_directory_conf: true\nprofessor: msrl\nhost_description: "#233377"\nmac_address: 12-12-12-12-12-21\nactive_directory_sssd_default_shell: /bin/bash\nactive_directory_join_user: user\nactive_directory_join_passwd: password12&u\nproxy_apt: true\nufw_enable_firewall: true\nufw_eth_default_rules: true\nufw_eth_default_zabbix: true\n\n',
    yaml_old:
      '---\n# Automatically generated by VAYS\n\nsystem_type: headless\npam_mount_volumes:\n  - fstype: nonauto22\n    path: /local/home/%(USER)\n    mountpoint: /home/%(USER)\n    options: bind\n    uid: 1001-10000000000\ngnome_default_favorite_apps:\n  - org.gnome.Nautilus.desktop\ninventory_groups:\n  - all\nhost_owner: infmsg+somename-test@inf.ethz.ch\nproxy_conf: true\nvpn_conf: false\nufw_conf: true\nactive_directory_conf: true\nprofessor: msrl\nhost_description: "#233377"\nmac_address: 12-12-12-12-12-21\nactive_directory_sssd_default_shell: /bin/bash\nactive_directory_join_user: user\nactive_directory_join_passwd: password12&u\nproxy_apt: true\nufw_enable_firewall: true\nufw_eth_default_rules: true\nufw_eth_default_zabbix: true\n',
  },
};

export const VALIDATE_02_NAME = VALIDATE_01_NAME;
export const VALIDATE_02_REQUEST = {
  operation: 'create',
  type: 'host',
  actions: [],
  name: null,
  entity: {
    name: null,
    yaml: '{"system_type":"desktop","pam_mount_volumes":[{"fstype":"auto","path":"/local/home/%(USER)","mountpoint":"/home/%(USER)","options":"bind","uid":"1001-10000000000"}],"gnome_default_favorite_apps":[],"inventory_groups":["all"],"host_owner":"infmsg+gdangeli-test@inf.ethz.ch","proxy_conf":false,"vpn_conf":false,"ufw_conf":true,"active_directory_conf":false}',
  },
};

export const VALIDATE_02_DATA = {
  system_type: 'desktop',
  pam_mount_volumes: [
    {
      fstype: 'auto',
      path: '/local/home/%(USER)',
      mountpoint: '/home/%(USER)',
      options: 'bind',
      uid: '1001-10000000000',
    },
  ],
  gnome_default_favorite_apps: [],
  inventory_groups: ['all'],
  host_owner: 'infmsg+gdangeli-test@inf.ethz.ch',
  proxy_conf: false,
  vpn_conf: false,
  ufw_conf: true,
  active_directory_conf: false,
};

export const VALIDATE_02_RESPONSE = {
  schemas: {
    json_schema: {
      type: 'object',
      properties: {
        system_type: {
          title: 'System Type',
          type: 'string',
          enum: ['desktop', 'headless'],
          default: 'desktop',
        },
        professor: { title: 'Select Professor', type: 'string', enum: ['msrl', 'pam'] },
        pam_mount_volumes: {
          type: 'array',
          title: 'Pam Mount Volumes (Headless)',
          default: [
            {
              fstype: 'auto',
              path: '/local/home/%(USER)',
              mountpoint: '/home/%(USER)',
              options: 'bind',
              uid: '1001-10000000000',
            },
          ],
          items: {
            type: 'object',
            properties: {
              fstype: { type: 'string', title: 'FS Type' },
              path: { type: 'string', title: 'Path' },
              mountpoint: { type: 'string', title: 'Mountpoint' },
              options: { type: 'string', title: 'Options' },
              uid: { type: 'string', title: 'UID' },
            },
            additionalProperties: false,
            required: ['fstype', 'path', 'mountpoint', 'options', 'uid'],
          },
        },
        gnome_default_favorite_apps: {
          type: 'array',
          maxItems: 100,
          minItems: 0,
          uniqueItems: true,
          items: { type: 'string' },
          title: 'Gnome Apps (Desktop)',
          default: ['yelp.desktop', 'org.gnome.Nautilus.desktop', 'gnome-terminal.desktop'],
        },
        inventory_groups: {
          title: 'Groups',
          type: 'array',
          items: {
            type: 'string',
            enum: ['all', 'desktop', 'headless', 'niggis_test2', 'noble', 'test-fuer-giuliano'],
          },
          default: ['all'],
        },
        host_description: {
          title: 'Host Description',
          type: 'string',
          pattern: '^[a-zA-Z0-9\\.,#@\\-_ ]*$',
          minLength: 5,
          maxLength: 200,
        },
        host_owner: {
          title: 'Host Owner',
          type: 'string',
          format: 'email',
          default: 'infmsg+gdangeli-test@inf.ethz.ch',
        },
        physical_host: {
          title: 'Physical Host',
          description: 'Hypervisor for Virtual Machine\n',
          type: 'string',
          format: 'hostname',
        },
        mac_address: { title: 'MAC Address', type: 'string' },
        proxy_conf: { title: 'Configure Proxy Settings', type: 'boolean', default: false },
        vpn_conf: { title: 'VPN', type: 'boolean', default: false },
        ufw_conf: { title: 'Configure UFW-Firewall', type: 'boolean', default: false },
        ufw_enable_firewall: { title: 'Enable UFW-Firewall', type: 'boolean', default: true },
        ufw_eth_default_rules: {
          title: 'UFW-Firewall: ETH Default Rules',
          description: 'Create eth-internal zone for ETH-Networks and allow SSH for this zone.\n',
          type: 'boolean',
          default: true,
        },
        ufw_eth_default_zabbix: {
          title: 'UFW-Firewall: ETH Default Zabbix',
          description: 'port 10050 and protocol tcp for Zabbix Monitoring\n',
          type: 'boolean',
          default: false,
        },
        ufw_rules: {
          title: 'Additional UFW-Firewall Rules',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { title: 'Allow', const: 'allow', default: 'allow' },
              source: {
                title: 'Source Address',
                type: 'string',
                pattern:
                  '^((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\/([0-9]|[12]\\d|3[0-2])$',
              },
              port: { title: 'Port', type: 'integer', minimum: 1 },
            },
            additionalProperties: false,
            required: ['rule', 'source', 'port'],
          },
        },
        active_directory_conf: { title: 'Join Active Directory', type: 'boolean', default: false },
      },
      additionalProperties: false,
      required: [
        'system_type',
        'professor',
        'pam_mount_volumes',
        'gnome_default_favorite_apps',
        'inventory_groups',
        'host_description',
        'host_owner',
        'mac_address',
        'proxy_conf',
        'vpn_conf',
        'ufw_conf',
        'ufw_enable_firewall',
        'ufw_eth_default_rules',
        'ufw_eth_default_zabbix',
        'active_directory_conf',
      ],
    },
    ui_schema: {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'General',
          elements: [
            { type: 'Control', scope: '#/properties/system_type', options: {} },
            { type: 'Control', scope: '#/properties/professor', options: {} },
            { type: 'Control', scope: '#/properties/inventory_groups', options: {} },
            {
              type: 'Group',
              label: 'Info',
              elements: [
                {
                  type: 'Control',
                  scope: '#/properties/host_description',
                  options: {
                    initial: '#2131423 niklausk',
                    initial_editable: false,
                    renderer: 'text_area',
                    rows: 'test',
                  },
                },
                { type: 'Control', scope: '#/properties/host_owner', options: {} },
                { type: 'Control', scope: '#/properties/physical_host', options: {} },
              ],
            },
          ],
        },
        {
          type: 'Category',
          label: 'Dynamic Config',
          elements: [
            { type: 'Control', scope: '#/properties/pam_mount_volumes', options: {} },
            { type: 'Control', scope: '#/properties/gnome_default_favorite_apps', options: {} },
          ],
        },
        {
          type: 'Category',
          label: 'Network',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/mac_address',
              options: {
                renderer: 'mac_address',
                initial: 'XX:xX:XX:XX:XX',
                initial_editable: false,
              },
            },
            { type: 'Control', scope: '#/properties/proxy_conf', options: {} },
            { type: 'Control', scope: '#/properties/vpn_conf', options: {} },
            { type: 'Control', scope: '#/properties/ufw_conf', options: {} },
            { type: 'Control', scope: '#/properties/ufw_enable_firewall', options: {} },
            { type: 'Control', scope: '#/properties/ufw_eth_default_rules', options: {} },
            { type: 'Control', scope: '#/properties/ufw_eth_default_zabbix', options: {} },
            { type: 'Control', scope: '#/properties/ufw_rules', options: {} },
          ],
        },
        {
          type: 'Category',
          label: 'Accounts',
          elements: [{ type: 'Control', scope: '#/properties/active_directory_conf', options: {} }],
        },
      ],
    },
    data: {
      system_type: 'desktop',
      pam_mount_volumes: [
        {
          fstype: 'auto',
          path: '/local/home/%(USER)',
          mountpoint: '/home/%(USER)',
          options: 'bind',
          uid: '1001-10000000000',
        },
      ],
      gnome_default_favorite_apps: [
        'yelp.desktop',
        'org.gnome.Nautilus.desktop',
        'gnome-terminal.desktop',
      ],
      inventory_groups: ['all'],
      host_owner: 'infmsg+gdangeli-test@inf.ethz.ch',
      proxy_conf: false,
      vpn_conf: false,
      ufw_conf: true,
      active_directory_conf: false,
      ufw_enable_firewall: true,
      ufw_eth_default_rules: true,
      ufw_eth_default_zabbix: false,
    },
    valid: false,
    message: "'professor' is a required property",
    validator: 'required',
    json_schema_loc: '#/required',
    data_loc: '#',
  },
  request: { valid: false, message: 'The entity.name must be set for this operation' },
};

export const VALIDATE_02_RESPONSE2 = {
  schemas: {
    json_schema: {
      type: 'object',
      properties: {
        system_type: {
          title: 'System Type',
          type: 'string',
          enum: ['desktop', 'headless'],
          default: 'desktop',
        },
        professor: { title: 'Select Professor', type: 'string', enum: ['msrl', 'pam'] },
        pam_mount_volumes: {
          type: 'array',
          title: 'Pam Mount Volumes (Headless)',
          default: [
            {
              fstype: 'auto',
              path: '/local/home/%(USER)',
              mountpoint: '/home/%(USER)',
              options: 'bind',
              uid: '1001-10000000000',
            },
          ],
          items: {
            type: 'object',
            properties: {
              fstype: { type: 'string', title: 'FS Type' },
              path: { type: 'string', title: 'Path' },
              mountpoint: { type: 'string', title: 'Mountpoint' },
              options: { type: 'string', title: 'Options' },
              uid: { type: 'string', title: 'UID' },
            },
            additionalProperties: false,
            required: ['fstype', 'path', 'mountpoint', 'options', 'uid'],
          },
        },
        gnome_default_favorite_apps: {
          type: 'array',
          maxItems: 100,
          minItems: 0,
          uniqueItems: true,
          items: { type: 'string' },
          title: 'Gnome Apps (Desktop)',
          default: ['yelp.desktop', 'org.gnome.Nautilus.desktop', 'gnome-terminal.desktop'],
        },
        inventory_groups: {
          title: 'Groups',
          type: 'array',
          items: {
            type: 'string',
            enum: ['all', 'desktop', 'headless', 'niggis_test2', 'noble', 'test-fuer-giuliano'],
          },
          default: ['all'],
        },
        host_description: {
          title: 'Host Description',
          type: 'string',
          pattern: '^[a-zA-Z0-9\\.,#@\\-_ ]*$',
          minLength: 5,
          maxLength: 200,
        },
        host_owner: {
          title: 'Host Owner',
          type: 'string',
          format: 'email',
          default: 'infmsg+gdangeli-test@inf.ethz.ch',
        },
        physical_host: {
          title: 'Physical Host',
          description: 'Hypervisor for Virtual Machine\n',
          type: 'string',
          format: 'hostname',
        },
        mac_address: { title: 'MAC Address', type: 'string' },
        proxy_conf: { title: 'Configure Proxy Settings', type: 'boolean', default: false },
        vpn_conf: { title: 'VPN', type: 'boolean', default: false },
        ufw_conf: { title: 'Configure UFW-Firewall', type: 'boolean', default: false },
        ufw_enable_firewall: { title: 'Enable UFW-Firewall', type: 'boolean', default: true },
        ufw_eth_default_rules: {
          title: 'UFW-Firewall: ETH Default Rules',
          description: 'Create eth-internal zone for ETH-Networks and allow SSH for this zone.\n',
          type: 'boolean',
          default: true,
        },
        ufw_eth_default_zabbix: {
          title: 'UFW-Firewall: ETH Default Zabbix',
          description: 'port 10050 and protocol tcp for Zabbix Monitoring\n',
          type: 'boolean',
          default: false,
        },
        ufw_rules: {
          title: 'Additional UFW-Firewall Rules',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { title: 'Allow', const: 'allow', default: 'allow' },
              source: {
                title: 'Source Address',
                type: 'string',
                pattern:
                  '^((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\/([0-9]|[12]\\d|3[0-2])$',
              },
              port: { title: 'Port', type: 'integer', minimum: 1 },
            },
            additionalProperties: false,
            required: ['rule', 'source', 'port'],
          },
        },
        active_directory_conf: { title: 'Join Active Directory', type: 'boolean', default: false },
      },
      additionalProperties: false,
      required: [
        'system_type',
        'professor',
        'pam_mount_volumes',
        'gnome_default_favorite_apps',
        'inventory_groups',
        'host_description',
        'host_owner',
        'mac_address',
        'proxy_conf',
        'vpn_conf',
        'ufw_conf',
        'ufw_enable_firewall',
        'ufw_eth_default_rules',
        'ufw_eth_default_zabbix',
        'active_directory_conf',
      ],
    },
    ui_schema: {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'General',
          elements: [
            { type: 'Control', scope: '#/properties/system_type', options: {} },
            { type: 'Control', scope: '#/properties/professor', options: {} },
            { type: 'Control', scope: '#/properties/inventory_groups', options: {} },
            {
              type: 'Group',
              label: 'Info',
              elements: [
                {
                  type: 'Control',
                  scope: '#/properties/host_description',
                  options: {
                    initial: '#2131423 niklausk',
                    initial_editable: false,
                    renderer: 'text_area',
                    rows: 'test',
                  },
                },
                { type: 'Control', scope: '#/properties/host_owner', options: {} },
                { type: 'Control', scope: '#/properties/physical_host', options: {} },
              ],
            },
          ],
        },
        {
          type: 'Category',
          label: 'Dynamic Config',
          elements: [
            { type: 'Control', scope: '#/properties/pam_mount_volumes', options: {} },
            { type: 'Control', scope: '#/properties/gnome_default_favorite_apps', options: {} },
          ],
        },
        {
          type: 'Category',
          label: 'Network',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/mac_address',
              options: {
                renderer: 'mac_address',
                initial: 'XX:xX:XX:XX:XX',
                initial_editable: false,
              },
            },
            { type: 'Control', scope: '#/properties/proxy_conf', options: {} },
            { type: 'Control', scope: '#/properties/vpn_conf', options: {} },
            { type: 'Control', scope: '#/properties/ufw_conf', options: {} },
            { type: 'Control', scope: '#/properties/ufw_enable_firewall', options: {} },
            { type: 'Control', scope: '#/properties/ufw_eth_default_rules', options: {} },
            { type: 'Control', scope: '#/properties/ufw_eth_default_zabbix', options: {} },
            { type: 'Control', scope: '#/properties/ufw_rules', options: {} },
          ],
        },
        {
          type: 'Category',
          label: 'Accounts',
          elements: [{ type: 'Control', scope: '#/properties/active_directory_conf', options: {} }],
        },
      ],
    },
    data: {
      system_type: 'desktop',
      pam_mount_volumes: [
        {
          fstype: 'auto',
          path: '/local/home/%(USER)',
          mountpoint: '/home/%(USER)',
          options: 'bind',
          uid: '1001-10000000000',
        },
      ],
      gnome_default_favorite_apps: [],
      inventory_groups: ['all'],
      host_owner: 'infmsg+gdangeli-test@inf.ethz.ch',
      proxy_conf: false,
      vpn_conf: false,
      ufw_conf: true,
      active_directory_conf: false,
      ufw_enable_firewall: true,
      ufw_eth_default_rules: true,
      ufw_eth_default_zabbix: false,
    },
    valid: false,
    message: "'professor' is a required property",
    validator: 'required',
    json_schema_loc: '#/required',
    data_loc: '#',
  },
  request: { valid: false, message: 'The entity.name must be set for this operation' },
};

export const VALIDATE_02_EXPECTED = {
  data: {
    active_directory_conf: false,
    gnome_default_favorite_apps: [],
    host_owner: 'infmsg+gdangeli-test@inf.ethz.ch',
    inventory_groups: ['all'],
    pam_mount_volumes: [
      {
        fstype: 'auto',
        mountpoint: '/home/%(USER)',
        options: 'bind',
        path: '/local/home/%(USER)',
        uid: '1001-10000000000',
      },
    ],
    proxy_conf: false,
    system_type: 'desktop',
    ufw_conf: true,
    ufw_enable_firewall: true,
    ufw_eth_default_rules: true,
    ufw_eth_default_zabbix: false,
    vpn_conf: false,
  },
  detail: 'The entity.name must be set for this operation',
  json_schema: {
    additionalProperties: false,
    properties: {
      active_directory_conf: {
        default: false,
        title: 'Join Active Directory',
        type: 'boolean',
      },
      gnome_default_favorite_apps: {
        default: ['yelp.desktop', 'org.gnome.Nautilus.desktop', 'gnome-terminal.desktop'],
        items: {
          type: 'string',
        },
        maxItems: 100,
        minItems: 0,
        title: 'Gnome Apps (Desktop)',
        type: 'array',
        uniqueItems: true,
      },
      host_description: {
        maxLength: 200,
        minLength: 5,
        pattern: '^[a-zA-Z0-9\\.,#@\\-_ ]*$',
        title: 'Host Description',
        type: 'string',
      },
      host_owner: {
        default: 'infmsg+gdangeli-test@inf.ethz.ch',
        format: 'email',
        title: 'Host Owner',
        type: 'string',
      },
      inventory_groups: {
        default: ['all'],
        items: {
          enum: ['all', 'desktop', 'headless', 'niggis_test2', 'noble', 'test-fuer-giuliano'],
          type: 'string',
        },
        title: 'Groups',
        type: 'array',
      },
      mac_address: {
        title: 'MAC Address',
        type: 'string',
      },
      name753984327583297515507489734124497987457185454894315: {
        pattern: '.*',
        title: 'Entity Name',
        type: 'string',
      },
      pam_mount_volumes: {
        default: [
          {
            fstype: 'auto',
            mountpoint: '/home/%(USER)',
            options: 'bind',
            path: '/local/home/%(USER)',
            uid: '1001-10000000000',
          },
        ],
        items: {
          additionalProperties: false,
          properties: {
            fstype: {
              title: 'FS Type',
              type: 'string',
            },
            mountpoint: {
              title: 'Mountpoint',
              type: 'string',
            },
            options: {
              title: 'Options',
              type: 'string',
            },
            path: {
              title: 'Path',
              type: 'string',
            },
            uid: {
              title: 'UID',
              type: 'string',
            },
          },
          required: ['fstype', 'path', 'mountpoint', 'options', 'uid'],
          type: 'object',
        },
        title: 'Pam Mount Volumes (Headless)',
        type: 'array',
      },
      physical_host: {
        description: 'Hypervisor for Virtual Machine\n',
        format: 'hostname',
        title: 'Physical Host',
        type: 'string',
      },
      professor: {
        enum: ['msrl', 'pam'],
        title: 'Select Professor',
        type: 'string',
      },
      proxy_conf: {
        default: false,
        title: 'Configure Proxy Settings',
        type: 'boolean',
      },
      system_type: {
        default: 'desktop',
        enum: ['desktop', 'headless'],
        title: 'System Type',
        type: 'string',
      },
      ufw_conf: {
        default: false,
        title: 'Configure UFW-Firewall',
        type: 'boolean',
      },
      ufw_enable_firewall: {
        default: true,
        title: 'Enable UFW-Firewall',
        type: 'boolean',
      },
      ufw_eth_default_rules: {
        default: true,
        description: 'Create eth-internal zone for ETH-Networks and allow SSH for this zone.\n',
        title: 'UFW-Firewall: ETH Default Rules',
        type: 'boolean',
      },
      ufw_eth_default_zabbix: {
        default: false,
        description: 'port 10050 and protocol tcp for Zabbix Monitoring\n',
        title: 'UFW-Firewall: ETH Default Zabbix',
        type: 'boolean',
      },
      ufw_rules: {
        items: {
          additionalProperties: false,
          properties: {
            port: {
              minimum: 1,
              title: 'Port',
              type: 'integer',
            },
            rule: {
              const: 'allow',
              default: 'allow',
              title: 'Allow',
            },
            source: {
              pattern:
                '^((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\/([0-9]|[12]\\d|3[0-2])$',
              title: 'Source Address',
              type: 'string',
            },
          },
          required: ['rule', 'source', 'port'],
          type: 'object',
        },
        title: 'Additional UFW-Firewall Rules',
        type: 'array',
      },
      vpn_conf: {
        default: false,
        title: 'VPN',
        type: 'boolean',
      },
    },
    required: [
      'system_type',
      'professor',
      'pam_mount_volumes',
      'gnome_default_favorite_apps',
      'inventory_groups',
      'host_description',
      'host_owner',
      'mac_address',
      'proxy_conf',
      'vpn_conf',
      'ufw_conf',
      'ufw_enable_firewall',
      'ufw_eth_default_rules',
      'ufw_eth_default_zabbix',
      'active_directory_conf',
      'name753984327583297515507489734124497987457185454894315',
    ],
    type: 'object',
  },
  ui_schema: {
    elements: [
      {
        elements: [
          {
            scope: '#/properties/name753984327583297515507489734124497987457185454894315',
            type: 'Control',
          },
          {
            options: {},
            scope: '#/properties/system_type',
            type: 'Control',
          },
          {
            options: {},
            scope: '#/properties/professor',
            type: 'Control',
          },
          {
            options: {},
            scope: '#/properties/inventory_groups',
            type: 'Control',
          },
          {
            elements: [
              {
                options: {
                  initial: '#2131423 niklausk',
                  initial_editable: false,
                  renderer: 'text_area',
                  rows: 'test',
                },
                scope: '#/properties/host_description',
                type: 'Control',
              },
              {
                options: {},
                scope: '#/properties/host_owner',
                type: 'Control',
              },
              {
                options: {},
                scope: '#/properties/physical_host',
                type: 'Control',
              },
            ],
            label: 'Info',
            type: 'Group',
          },
        ],
        label: 'General',
        type: 'Category',
      },
      {
        elements: [
          {
            options: {},
            scope: '#/properties/pam_mount_volumes',
            type: 'Control',
          },
          {
            options: {},
            scope: '#/properties/gnome_default_favorite_apps',
            type: 'Control',
          },
        ],
        label: 'Dynamic Config',
        type: 'Category',
      },
      {
        elements: [
          {
            options: {
              initial: 'XX:xX:XX:XX:XX',
              initial_editable: false,
              renderer: 'mac_address',
            },
            scope: '#/properties/mac_address',
            type: 'Control',
          },
          {
            options: {},
            scope: '#/properties/proxy_conf',
            type: 'Control',
          },
          {
            options: {},
            scope: '#/properties/vpn_conf',
            type: 'Control',
          },
          {
            options: {},
            scope: '#/properties/ufw_conf',
            type: 'Control',
          },
          {
            options: {},
            scope: '#/properties/ufw_enable_firewall',
            type: 'Control',
          },
          {
            options: {},
            scope: '#/properties/ufw_eth_default_rules',
            type: 'Control',
          },
          {
            options: {},
            scope: '#/properties/ufw_eth_default_zabbix',
            type: 'Control',
          },
          {
            options: {},
            scope: '#/properties/ufw_rules',
            type: 'Control',
          },
        ],
        label: 'Network',
        type: 'Category',
      },
      {
        elements: [
          {
            options: {},
            scope: '#/properties/active_directory_conf',
            type: 'Control',
          },
        ],
        label: 'Accounts',
        type: 'Category',
      },
    ],
    type: 'Categorization',
  },
  valid: false,
};
