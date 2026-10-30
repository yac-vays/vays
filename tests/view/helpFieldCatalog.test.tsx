import { render } from 'react-dom';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discoverEntityFields } from '../../src/controller/local/Help/fieldCatalog';
import VAYS_CACHE from '../../src/model/caching';
import { ENTITY_TYPE_CACHE_KEY } from '../../src/model/caching/cachekeys';
import { EntityTypeDecl, NameGeneratedCond } from '../../src/utils/types/api';
import { YACBackend } from '../../src/utils/types/config';
import Docs from '../../src/view/pages/Docs';
import { createFetchResponse } from '../testUtils';

global.fetch = vi.fn();

const TEST_BACKEND: YACBackend = {
  name: 'inventory',
  title: 'Inventory',
  url: 'https://yac-inventory.example.com',
  icon: '',
};

const HOST_ENTITY_TYPE: EntityTypeDecl = {
  name: 'host',
  title: 'Hosts',
  name_pattern: '^[a-z0-9.-]+$',
  name_example: 'host-01.example.com',
  name_generated: NameGeneratedCond.never,
  description: 'Host configuration',
  create: true,
  edit: true,
  delete: true,
  options: [],
  logs: [],
  actions: [
    {
      name: 'install',
      title: 'Start Installation',
      description: 'Reinstall host',
      dangerous: true,
      icon: '',
      perms: ['inst'],
      force: false,
      hooks: [],
    },
  ],
  favorites: [],
};

const BASE_UI_SCHEMA = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'General',
      elements: [
        {
          type: 'Group',
          label: 'Host Information',
          elements: [
            { type: 'Control', scope: '#/properties/system_type' },
            { type: 'Control', scope: '#/properties/inventory_location' },
          ],
        },
      ],
    },
    {
      type: 'Category',
      label: 'Users',
      elements: [
        { type: 'Control', scope: '#/properties/users_regular' },
        { type: 'Control', scope: '#/properties/users_root' },
      ],
    },
    {
      type: 'Category',
      label: 'Software',
      elements: [
        { type: 'Control', scope: '#/properties/role_docker' },
        { type: 'Control', scope: '#/properties/docker_rootless' },
      ],
    },
  ],
};

function buildValidateResponse(operation: string, data: Record<string, unknown> = {}) {
  const properties: Record<string, unknown> = {
    system_type:
      operation === 'edit'
        ? { const: 'desktop' }
        : {
            type: 'string',
            title: 'System Type',
            description: 'Hardware role of the system',
            default: 'desktop',
            oneOf: [
              { const: 'desktop', title: 'Desktop' },
              { const: 'server', title: 'Server' },
            ],
          },
    inventory_location: {
      type: 'string',
      title: 'Location',
      description: 'Physical room and rack location',
      pattern: '^[A-Z]{2,3}/[0-9]+$',
    },
    users_regular: {
      type: 'array',
      title: 'Regular Users',
      description: 'Users allowed to log in without root privileges',
      uniqueItems: true,
      items: { type: 'string', format: 'eth_user' },
    },
    role_docker: {
      type: 'boolean',
      title: 'Install Docker',
      description: 'Enable Docker runtime',
    },
  };

  // Conditional yac_if property: only present when role_docker is true
  if (data.role_docker === true) {
    properties.docker_rootless = {
      type: 'boolean',
      title: 'Enable Docker Rootless',
      description: 'Run Docker daemon in rootless mode',
    };
  }

  // Permission-restricted property (yac_perms: ['root']): only present on 'read'
  if (operation === 'read') {
    properties.users_root = {
      type: 'array',
      title: 'Root Users',
      description: 'Users with root privilege (requires root permission)',
      minItems: 1,
      uniqueItems: true,
      items: { type: 'string', format: 'eth_user' },
    };
  }

  return {
    schemas: {
      json_schema: {
        type: 'object',
        required: ['system_type', 'users_regular'],
        properties,
      },
      ui_schema: BASE_UI_SCHEMA,
      data: {},
      valid: true,
    },
    request: {
      valid: true,
    },
  };
}

describe('Configuration Docs FieldCatalog discovery and rendering', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    VAYS_CACHE.invalidate(ENTITY_TYPE_CACHE_KEY, `${TEST_BACKEND.url}/entity`);
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    VAYS_CACHE.invalidate(ENTITY_TYPE_CACHE_KEY, `${TEST_BACKEND.url}/entity`);
  });

  it('discovers all fields including conditional yac_if fields and classifies editable, create_only, and support_only', async () => {
    //@ts-expect-error Mocked fetch implementation
    global.fetch.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/validate') && init?.body) {
        const body = JSON.parse(String(init.body));
        const op = body.operation as string;
        const data = (body.entity?.data ?? {}) as Record<string, unknown>;
        return createFetchResponse(buildValidateResponse(op, data));
      }
      return createFetchResponse([HOST_ENTITY_TYPE]);
    });

    const fields = await discoverEntityFields(TEST_BACKEND, HOST_ENTITY_TYPE);
    const byKey = new Map(fields.map((f) => [f.key, f]));

    // 1. Standard user-editable field
    const loc = byKey.get('inventory_location');
    expect(loc).toBeDefined();
    expect(loc?.accessTier).toBe('editable');
    expect(loc?.requiresSupportRequest).toBe(false);
    expect(loc?.category).toBe('General');
    expect(loc?.group).toBe('Host Information');
    expect(loc?.constraints).toContain('pattern: ^[A-Z]{2,3}/[0-9]+$');

    // 2. Create / Reinstall only field (const-pinned on edit)
    const sysType = byKey.get('system_type');
    expect(sysType).toBeDefined();
    expect(sysType?.accessTier).toBe('create_only');
    expect(sysType?.requiresSupportRequest).toBe(true);
    expect(sysType?.allowedValues).toContain('desktop (Desktop)');
    expect(sysType?.allowedValues).toContain('server (Server)');

    // 3. Support-only restricted field (present in read, omitted in create & edit)
    const rootUsers = byKey.get('users_root');
    expect(rootUsers).toBeDefined();
    expect(rootUsers?.accessTier).toBe('support_only');
    expect(rootUsers?.requiresSupportRequest).toBe(true);
    expect(rootUsers?.accessLabel).toContain('Support Group');

    // 4. Conditional yac_if field discovered by toggling role_docker=true
    const rootless = byKey.get('docker_rootless');
    expect(rootless).toBeDefined();
    expect(rootless?.title).toBe('Enable Docker Rootless');
    expect(rootless?.conditionHint).toBeDefined();
  });

  it('renders the Configuration Reference page (/docs) and highlights support-restricted fields', async () => {
    //@ts-expect-error Mocked fetch implementation
    global.fetch.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/entity')) {
        return createFetchResponse([HOST_ENTITY_TYPE]);
      }
      if (url.endsWith('/validate') && init?.body) {
        const body = JSON.parse(String(init.body));
        return createFetchResponse(
          buildValidateResponse(body.operation, body.entity?.data ?? {}),
        );
      }
      return createFetchResponse({});
    });

    const container = document.createElement('div');
    render(
      <MemoryRouter initialEntries={['/docs']}>
        <Docs backends={[TEST_BACKEND]} />
      </MemoryRouter>,
      container,
    );

    await new Promise((res) => setTimeout(res, 300));

    expect(container.textContent).toContain('users_root');
    expect(container.textContent).toContain('inventory_location');
    expect(container.textContent).toContain('docker_rootless');

    const supportBadge = container.querySelector('[data-testid="badge-support-users_root"]');
    expect(supportBadge).not.toBeNull();
    expect(supportBadge?.textContent).toContain('Request via Support Group');

    const createOnlyBadge = container.querySelector(
      '[data-testid="badge-create-only-system_type"]',
    );
    expect(createOnlyBadge).not.toBeNull();
    expect(createOnlyBadge?.textContent).toContain('Request via Support Group');

    const editableBadge = container.querySelector(
      '[data-testid="badge-editable-inventory_location"]',
    );
    expect(editableBadge).not.toBeNull();
    expect(editableBadge?.textContent).toContain('Editable by user');
  });
});
