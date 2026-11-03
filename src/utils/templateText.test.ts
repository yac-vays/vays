import { describe, expect, it } from 'vitest';
import { renderTemplate, renderTemplates, resolveRef } from './templateText';

const data = {
  group: 'isg',
  'a/b': 'slash',
  users: [
    { basename: 'usr1', permissions: 'admin', n: 0, ok: false },
    { basename: '', permissions: 'read', obj: { x: 1 } },
  ],
};

const text = (template: string, path: string) =>
  renderTemplate(template, data, path)
    .map((p) => (p.missing ? `<${p.text}>` : p.text))
    .join('');

describe('resolveRef', () => {
  it('resolves siblings, parents and absolute pointers', () => {
    expect(resolveRef('basename', 'users.0.username')).toEqual(['users', '0', 'basename']);
    expect(resolveRef('./basename', 'users.0.username')).toEqual(['users', '0', 'basename']);
    expect(resolveRef('../1/basename', 'users.0.username')).toEqual(['users', '1', 'basename']);
    expect(resolveRef('/group', 'users.0.username')).toEqual(['group']);
    expect(resolveRef('/a~1b', 'x')).toEqual(['a/b']);
    expect(resolveRef('group', 'username')).toEqual(['group']);
  });

  it('rejects empty refs and walking above the root', () => {
    expect(resolveRef('', 'users.0.username')).toBeNull();
    expect(resolveRef('../x', 'username')).toBeNull();
  });
});

describe('renderTemplate', () => {
  it('substitutes item-relative and absolute values', () => {
    expect(text('bkt-{basename}-{permissions}', 'users.0.username')).toBe('bkt-usr1-admin');
    expect(text('{/group}:{basename}', 'users.0.username')).toBe('isg:usr1');
    expect(text('{/a~1b}', 'users.0.username')).toBe('slash');
  });

  it('stringifies numbers and booleans', () => {
    expect(text('{n}/{ok}', 'users.0.username')).toBe('0/false');
  });

  it('leaves missing, empty and non-scalar values unresolved', () => {
    expect(text('bkt-{basename}-{permissions}', 'users.1.username')).toBe('bkt-<{basename}>-read');
    expect(text('{obj}{nope}{}', 'users.1.username')).toBe('<{obj}><{nope}><{}>');
  });

  it('merges adjacent literal text into one part', () => {
    expect(renderTemplate('a-{basename}-b', data, 'users.0.username')).toEqual([
      { text: 'a-usr1-b' },
    ]);
  });

  it('keeps stray braces as text', () => {
    expect(text('a { b', 'users.0.username')).toBe('a { b');
  });
});

describe('renderTemplates', () => {
  const join = (templates: string[], path: string) =>
    renderTemplates(templates, data, path)
      .map((p) => (p.missing ? `<${p.text}>` : p.text))
      .join('');

  it('uses the first completely resolved template', () => {
    expect(join(['{legacy}', '{basename}-{permissions}'], 'users.0.username')).toBe('usr1-admin');
    expect(join(['{permissions}', '{basename}'], 'users.0.username')).toBe('admin');
  });

  it('falls back to the last template, unresolved', () => {
    expect(join(['{legacy}', 'bkt-{basename}'], 'users.1.username')).toBe('bkt-<{basename}>');
  });

  it('renders nothing for an empty list', () => {
    expect(renderTemplates([], data, 'users.0.username')).toEqual([]);
  });
});
