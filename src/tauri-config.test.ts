import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const conf = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src-tauri/tauri.conf.json'), 'utf8'),
) as { identifier: string; app: { security: { csp: Record<string, string> } } };

// Tauri's IPC is the one http origin the app needs. It is a scheme the webview
// talks to the Rust side over, not a host it reaches out to, so the test holds
// it to the same rule as every other origin.
const tauriIpc = 'http://ipc.localhost';

function remoteOrigins(): string[] {
  return Object.values(conf.app.security.csp)
    .flatMap((directive) => directive.split(/\s+/))
    .filter((source) => /^https?:\/\//.test(source) && source !== tauriIpc);
}

describe('the content security policy', () => {
  it('names no http or https origin other than the IPC channel', () => {
    expect(remoteOrigins()).toEqual([]);
  });

  it('allows blob images, which is how the app shows a profile picture', () => {
    expect(conf.app.security.csp['img-src']).toContain('blob:');
  });

  it('allows images only from the app itself and from blob URLs', () => {
    const sources = conf.app.security.csp['img-src'].split(/\s+/).sort();
    expect(sources).toEqual(["'self'", 'blob:']);
  });

  it('allows only the app itself to reach anything', () => {
    expect(conf.app.security.csp['default-src']).toContain("'self'");
    expect(conf.app.security.csp['connect-src']).toContain('ipc:');
  });
});

describe('the app identifier', () => {
  it('is privatelink.allies, which the data folder follows', () => {
    expect(conf.identifier).toBe('privatelink.allies');
  });
});