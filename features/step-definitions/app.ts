import { spawn } from 'node:child_process';
import { appendFileSync, openSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The Tauri service launches the app once per run, and reloadSession() can't
// relaunch it, because the WebDriver server lives inside the app. Scenarios
// that close or restart the app launch it again here. wdio.conf.ts stops these
// processes when the run ends.
export const APP_BINARY = './src-tauri/target/debug/allies';
export const EMBEDDED_PORT = 4445;
export const RELAUNCHED_PIDS = join(tmpdir(), 'allies-e2e-relaunched.pids');
export const RELAUNCHED_LOG = join(tmpdir(), 'allies-e2e-relaunched.log');

// The Tauri identifier, which is the folder the app keeps its data in. An
// end-to-end build points XDG_CONFIG_HOME at a temporary folder, so this is
// that folder and never the user's real one.
export const IDENTIFIER = 'privatelink.allies';

export function configDir(): string {
  const base = process.env.XDG_CONFIG_HOME;
  if (!base) throw new Error('XDG_CONFIG_HOME is not set. Run the suite with npm run test:e2e.');
  return join(base, IDENTIFIER);
}

// How often the waits below re-check their condition.
const POLL_INTERVAL_MS = 100;

async function serverUp(): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${EMBEDDED_PORT}/status`);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitFor(condition: () => Promise<boolean>, what: string, timeout = 15_000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`Timed out after ${timeout} ms waiting for ${what}`);
}

export async function appIsClosed(): Promise<boolean> {
  return !(await serverUp());
}

export async function waitForAppToClose(timeout = 5_000) {
  await waitFor(appIsClosed, 'the app to close', timeout);
}

// Runs a WebDriver command that makes the app exit. The request may fail
// because the app goes away before it answers, which is fine once it's closed.
export async function expectingExit(command: () => Promise<unknown>) {
  try {
    await command();
  } catch (error) {
    // Give the app a moment to actually go away, then decide whether the
    // failure was just the connection dropping.
    try {
      await waitFor(appIsClosed, 'the app to close', 5_000);
    } catch {
      throw error;
    }
  }
}

export async function launchApp() {
  const child = spawn(APP_BINARY, [], {
    // The same temporary config folder as the app the service started, so a
    // relaunched app reads the data the previous run wrote.
    env: {
      ...process.env,
      TAURI_WEBDRIVER_PORT: String(EMBEDDED_PORT),
      WDIO_EMBEDDED_SERVER: 'true',
    },
    stdio: ['ignore', openSync(RELAUNCHED_LOG, 'a'), openSync(RELAUNCHED_LOG, 'a')],
    detached: true,
  });
  child.unref();
  appendFileSync(RELAUNCHED_PIDS, `${child.pid}\n`);
  await waitFor(serverUp, 'the relaunched app');
  await browser.reloadSession();
  await $('header[data-testid="top-bar"]').waitForExist({ timeout: 20_000 });
}

export async function restartApp() {
  await expectingExit(() =>
    browser.execute(() => {
      void (window as unknown as { __TAURI__: { app: { exit: (code: number) => Promise<void> } } }).__TAURI__.app.exit(0);
    }),
  );
  await waitForAppToClose();
  await launchApp();
}