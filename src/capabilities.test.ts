import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const capability = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src-tauri/capabilities/default.json'), 'utf8'),
) as { permissions: (string | { identifier: string; allow?: { path: string }[] })[] };

// Pictures are the only files the app's own frontend touches, so the fs
// permissions may name nothing else. fs:default is the plugin's own set for
// reading the app's folders, which is not a path the app chooses.
const scoped = capability.permissions.filter(
  (permission): permission is { identifier: string; allow?: { path: string }[] } =>
    typeof permission === 'object' && permission.identifier.startsWith('fs:'),
);

const ALLOWED_PREFIX = '$APPCONFIG/pictures';

describe('the file system capability', () => {
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

  it('allows reading, writing and removing a picture', () => {
    expect(scoped.map((permission) => permission.identifier)).toEqual([
      'fs:allow-read-file',
      'fs:allow-write-file',
      'fs:allow-remove',
    ]);
  });

  it('never denies the pictures folder', () => {
    expect(JSON.stringify(capability)).not.toContain('"deny"');
  });
});