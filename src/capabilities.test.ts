import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const capability = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src-tauri/capabilities/default.json'), 'utf8'),
) as { permissions: Permission[] };

type Permission = string | { identifier: string; allow?: { path: string }[] };

// Pictures are the only files the app's own frontend touches, so the fs
// permissions may name nothing else. Every fs permission must be an object
// with a path limit. A plain string such as fs:default grants a set the app
// does not choose, which includes reading the whole config folder.
const fsPermissions = capability.permissions.filter((permission) =>
  (typeof permission === 'string' ? permission : permission.identifier).startsWith('fs:'),
);

const scoped = fsPermissions.filter(
  (permission): permission is { identifier: string; allow?: { path: string }[] } =>
    typeof permission === 'object',
);

const ALLOWED_PREFIX = '$APPCONFIG/pictures';

describe('the file system capability', () => {
  it('has no fs permission without a path limit', () => {
    const unlimited = fsPermissions.filter(
      (permission) =>
        typeof permission === 'string' || !permission.allow || permission.allow.length === 0,
    );

    expect(unlimited).toEqual([]);
  });

  it('scopes every fs permission that names paths to the pictures folder', () => {
    expect(scoped.length).toBeGreaterThan(0);

    for (const permission of scoped) {
      for (const path of permission.allow ?? []) {
        expect(
          path.path === ALLOWED_PREFIX || path.path.startsWith(`${ALLOWED_PREFIX}/`) || path.path.startsWith(`${ALLOWED_PREFIX}/**`),
          `${permission.identifier} allows ${path.path}`,
        ).toBe(true);
      }
    }
  });

  it('allows creating the folder, then reading, writing and removing a picture', () => {
    expect(scoped.map((permission) => permission.identifier)).toEqual([
      'fs:allow-mkdir',
      'fs:allow-read-file',
      'fs:allow-write-file',
      'fs:allow-remove',
    ]);
  });

  it('never denies the pictures folder', () => {
    expect(JSON.stringify(capability)).not.toContain('"deny"');
  });
});