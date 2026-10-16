import '@wdio/tauri-service';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { APP_BINARY, RELAUNCHED_PIDS } from './features/step-definitions/app';

// A wdio build keeps its database and pictures under this config folder, so a
// run never touches the real one. onPrepare creates it in the launcher
// process, and the workers and the apps they start inherit it.
let e2eDir: string | undefined;

// Stops the apps that scenarios relaunched after closing or restarting the one
// the service started.
function stopRelaunchedApps() {
  if (!existsSync(RELAUNCHED_PIDS)) return;
  for (const pid of readFileSync(RELAUNCHED_PIDS, 'utf8').split('\n').filter(Boolean)) {
    try {
      process.kill(Number(pid));
    } catch {
      // Already gone.
    }
  }
  rmSync(RELAUNCHED_PIDS);
}

// The service reads `tauri:options` at runtime. It is absent from the base
// config capability type, so the cast crosses that gap.
const capabilities = [
  {
    browserName: 'tauri',
    'tauri:options': {
      application: APP_BINARY,
    },
  },
] as unknown as WebdriverIO.Capabilities[];

export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./features/**/*.feature'],
  maxInstances: 1,
  capabilities,
  services: ['@wdio/tauri-service'],
  framework: 'cucumber',
  cucumberOpts: {
    require: ['./features/step-definitions/*.ts'],
    timeout: 30_000,
  },
  reporters: ['spec'],
  logLevel: 'warn',
  onPrepare() {
    stopRelaunchedApps();
    e2eDir = mkdtempSync(join(tmpdir(), 'allies-e2e-'));
    process.env.XDG_CONFIG_HOME = join(e2eDir, 'config');
  },
  // The apps stop first, so none of them writes into the folder while it goes.
  onComplete() {
    stopRelaunchedApps();
    if (e2eDir) rmSync(e2eDir, { recursive: true, force: true });
  },
};