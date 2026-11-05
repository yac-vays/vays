import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  CatalogField,
  discoverEntityFields,
  FieldAccessTier,
} from '../../../controller/local/Help/fieldCatalog';
import { getEntityTypes } from '../../../model/entityType';
import { EntityTypeDecl } from '../../../utils/types/api';
import { YACBackend } from '../../../utils/types/config';

interface FieldCatalogProps {
  backends: YACBackend[];
}

type AccessFilter = 'all' | FieldAccessTier;

const ACCESS_FILTERS: { id: AccessFilter; label: string }[] = [
  { id: 'all', label: 'All Fields' },
  { id: 'editable', label: 'Editable by You' },
  { id: 'support_only', label: 'Request via Support Group' },
  { id: 'create_only', label: 'Create / Reinstall Only' },
];

const FieldCatalog: React.FC<FieldCatalogProps> = ({ backends }) => {
  const validBackends = backends.filter((b) => Boolean(b.url));
  const [selectedBackendName, setSelectedBackendName] = useState<string>(
    validBackends[0]?.name ?? '',
  );
  const [entityTypes, setEntityTypes] = useState<EntityTypeDecl[]>([]);
  const [selectedTypeName, setSelectedTypeName] = useState<string>('');
  const [fields, setFields] = useState<CatalogField[]>([]);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);
  const [loadingFields, setLoadingFields] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAccess, setSelectedAccess] = useState<AccessFilter>('all');

  useEffect(() => {
    if (!selectedBackendName && validBackends.length > 0) {
      setSelectedBackendName(validBackends[0].name);
    }
  }, [backends]);

  const activeBackend =
    validBackends.find((b) => b.name === selectedBackendName) ?? validBackends[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    if (!activeBackend) {
      setEntityTypes([]);
      setSelectedTypeName('');
      return;
    }

    setLoadingTypes(true);
    (async () => {
      const types = await getEntityTypes(activeBackend);
      if (cancelled) return;
      setEntityTypes(types);
      setSelectedTypeName((prev) =>
        types.some((t) => t.name === prev) ? prev : (types[0]?.name ?? ''),
      );
      setLoadingTypes(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeBackend?.url]);

  const activeEntityType =
    entityTypes.find((t) => t.name === selectedTypeName) ?? entityTypes[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    if (!activeBackend || !activeEntityType) {
      setFields([]);
      return;
    }

    setLoadingFields(true);
    setSelectedCategory('All');
    (async () => {
      const discovered = await discoverEntityFields(activeBackend, activeEntityType);
      if (cancelled) return;
      setFields(discovered);
      setLoadingFields(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeBackend?.url, activeEntityType?.name]);

  const categories = [
    'All',
    ...Array.from(new Set(fields.map((f) => f.category).filter(Boolean))),
  ];

  const filteredFields = fields.filter((field) => {
    if (selectedCategory !== 'All' && field.category !== selectedCategory) {
      return false;
    }
    if (selectedAccess !== 'all' && field.accessTier !== selectedAccess) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const haystack = [
        field.key,
        field.title,
        field.description,
        field.category,
        field.group,
        field.accessLabel,
        ...field.allowedValues,
        ...field.constraints,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    }
    return true;
  });

  const editableCount = fields.filter((f) => f.accessTier === 'editable').length;
  const supportCount = fields.filter((f) => f.accessTier === 'support_only').length;
  const createOnlyCount = fields.filter((f) => f.accessTier === 'create_only').length;

  const renderAccessBadge = (field: CatalogField) => {
    if (field.accessTier === 'support_only') {
      return (
        <span
          data-testid={`badge-support-${field.key}`}
          className="inline-block rounded-xs border border-danger bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger"
        >
          {field.accessLabel}
        </span>
      );
    }
    if (field.accessTier === 'create_only') {
      return (
        <span
          data-testid={`badge-create-only-${field.key}`}
          className="inline-block rounded-xs border border-amber-500 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
        >
          {field.accessLabel}
        </span>
      );
    }
    return (
      <span
        data-testid={`badge-editable-${field.key}`}
        className="inline-block rounded-xs border border-emerald-600 bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
      >
        {field.accessLabel}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Info Callout */}
      <div className="rounded-xs border border-stroke bg-primary-5 p-4 text-sm text-plainfont dark:bg-meta-4">
        <p className="font-semibold">Configuration Fields &amp; Support Group Requests</p>
        <p className="mt-1 text-reducedfont">
          This page lists all possible configuration fields and allowed values for each entity type.
          Fields marked{' '}
          <span className="font-semibold text-danger">Request via Support Group</span> or{' '}
          <span className="font-semibold text-amber-700 dark:text-amber-300">Locked on edit</span>{' '}
          cannot be modified directly by standard users and must be requested through your support
          group (see the{' '}
          <Link to="/help" className="text-primary underline hover:opacity-80">
            Help page
          </Link>{' '}
          for contact information).
        </p>
      </div>

      {/* Backend & Entity Type Selectors */}
      <div className="flex flex-wrap items-center gap-4">
        {validBackends.length > 1 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="docs-backend-select"
              className="text-sm font-semibold text-plainfont"
            >
              Backend:
            </label>
            <select
              id="docs-backend-select"
              value={activeBackend?.name ?? ''}
              onChange={(e) => setSelectedBackendName(e.target.value)}
              className="rounded-xs border border-stroke bg-white px-3 py-1.5 text-sm text-plainfont dark:border-form-strokedark dark:bg-form-input"
            >
              {validBackends.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-plainfont">Configuration Type:</span>
          {loadingTypes ? (
            <span className="text-sm text-reducedfont">Loading types…</span>
          ) : entityTypes.length === 0 ? (
            <span className="text-sm text-reducedfont">No entity types available.</span>
          ) : (
            entityTypes.map((et) => {
              const isSelected = et.name === activeEntityType?.name;
              return (
                <button
                  key={et.name}
                  type="button"
                  onClick={() => setSelectedTypeName(et.name)}
                  className={`rounded-xs border px-3 py-1.5 text-sm font-medium duration-150 ${
                    isSelected
                      ? 'border-primary bg-primary text-plainfont-inv'
                      : 'border-stroke bg-white text-plainfont hover:border-primary dark:bg-boxdark'
                  }`}
                >
                  {et.title} ({et.name})
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xs border border-stroke bg-white p-4 dark:bg-boxdark">
          <div className="text-2xl font-bold text-plainfont">{fields.length}</div>
          <div className="text-xs text-reducedfont">Total Configuration Fields</div>
        </div>
        <div className="rounded-xs border border-stroke bg-white p-4 dark:bg-boxdark">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {editableCount}
          </div>
          <div className="text-xs text-reducedfont">Editable by You</div>
        </div>
        <div className="rounded-xs border border-stroke bg-white p-4 dark:bg-boxdark">
          <div className="text-2xl font-bold text-danger">{supportCount}</div>
          <div className="text-xs text-reducedfont">
            Restricted — Request via Support Group
          </div>
        </div>
        <div className="rounded-xs border border-stroke bg-white p-4 dark:bg-boxdark">
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {createOnlyCount}
          </div>
          <div className="text-xs text-reducedfont">
            Create / Reinstall Only (Support to Edit)
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 rounded-xs border border-stroke bg-white p-4 dark:bg-boxdark">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by YAML key, title, allowed value, regex, or description…"
            aria-label="Filter configuration fields"
            className="w-full max-w-md rounded-xs border border-stroke bg-transparent px-3 py-2 text-sm text-plainfont outline-hidden focus:border-primary dark:border-form-strokedark dark:bg-form-input"
          />
          <span className="text-xs text-reducedfont">
            Showing {filteredFields.length} of {fields.length} fields
          </span>
        </div>

        {/* Access Tier Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-reducedfont">Access:</span>
          {ACCESS_FILTERS.map((af) => (
            <button
              key={af.id}
              type="button"
              onClick={() => setSelectedAccess(af.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium duration-150 ${
                selectedAccess === af.id
                  ? 'border-primary bg-primary text-plainfont-inv'
                  : 'border-stroke bg-transparent text-plainfont hover:border-primary'
              }`}
            >
              {af.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        {categories.length > 2 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-reducedfont">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full border px-3 py-1 text-xs font-medium duration-150 ${
                  selectedCategory === cat
                    ? 'border-primary bg-primary text-plainfont-inv'
                    : 'border-stroke bg-transparent text-plainfont hover:border-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fields Table */}
      <div className="overflow-x-auto rounded-xs border border-stroke bg-white dark:bg-boxdark">
        {loadingFields ? (
          <div className="p-8 text-center text-sm text-reducedfont">
            Discovering configuration fields and restrictions…
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="p-8 text-center text-sm text-reducedfont">
            No configuration fields match the current filters.
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stroke bg-primary-5 dark:bg-meta-4">
                <th className="py-3 px-4 font-bold text-plainfont">YAML Key &amp; Title</th>
                <th className="py-3 px-4 font-bold text-plainfont">Category / Group</th>
                <th className="py-3 px-4 font-bold text-plainfont">Type &amp; Default</th>
                <th className="py-3 px-4 font-bold text-plainfont">Editability / Support Status</th>
                <th className="py-3 px-4 font-bold text-plainfont">
                  Allowed Values, Constraints &amp; Description
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFields.map((field) => (
                <tr
                  key={field.key}
                  data-testid={`field-row-${field.key}`}
                  className={`border-b border-stroke align-top ${
                    field.requiresSupportRequest ? 'bg-danger/5 dark:bg-danger/10' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="font-mono text-xs font-bold text-plainfont">{field.key}</div>
                    <div className="mt-0.5 text-xs text-reducedfont">{field.title}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium text-plainfont">{field.category}</div>
                    {field.group !== '-' && (
                      <div className="text-xs text-reducedfont">{field.group}</div>
                    )}
                    {field.conditionHint && (
                      <div className="mt-1 text-xs italic text-reducedfont">
                        Available {field.conditionHint}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-mono text-xs text-plainfont">{field.type}</div>
                    <div className="mt-1 text-xs text-reducedfont">
                      {field.required ? (
                        <span className="font-semibold text-plainfont">Required</span>
                      ) : (
                        'Optional'
                      )}
                    </div>
                    {field.defaultValue !== undefined && (
                      <div className="mt-0.5 text-xs text-reducedfont">
                        Default: <code className="font-mono">{field.defaultValue}</code>
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4">{renderAccessBadge(field)}</td>

                  <td className="py-3 px-4">
                    {field.description && (
                      <p className="mb-1.5 text-xs text-plainfont">{field.description}</p>
                    )}
                    {field.allowedValues.length > 0 && (
                      <div className="mb-1 text-xs">
                        <span className="font-semibold text-plainfont">Allowed values: </span>
                        <span className="font-mono text-reducedfont">
                          {field.allowedValues.join(', ')}
                        </span>
                      </div>
                    )}
                    {field.constraints.length > 0 && (
                      <div className="text-xs">
                        <span className="font-semibold text-plainfont">Constraints: </span>
                        <span className="font-mono text-reducedfont">
                          {field.constraints.join(' · ')}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FieldCatalog;
