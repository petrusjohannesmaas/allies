import { mockIPC } from '@tauri-apps/api/mocks';

// An in-memory stand-in for tauri-plugin-store, answering the IPC commands
// that LazyStore sends, and the two path commands that find the config folder. `others` answers every other command, since a test
// has only one IPC handler.
export function fakeStore(
  initial: Record<string, unknown> = {},
  others: (cmd: string, args?: unknown) => unknown = () => undefined,
  configDir = '/home/u/.config/privatelink.allies',
) {
  const data = new Map<string, unknown>(Object.entries(initial));
  const saves: Record<string, unknown>[] = [];
  const paths: string[] = [];
  const failing = { load: false, save: false };
  // Set `hold` to a promise to keep every save pending until it settles.
  const gate: { hold: Promise<void> | null } = { hold: null };

  mockIPC((cmd, args) => {
    const a = (args ?? {}) as Record<string, unknown>;
    switch (cmd) {
      case 'plugin:path|resolve_directory':
        return configDir;
      case 'plugin:path|join':
        return (a.paths as string[]).join('/');
      case 'plugin:store|load':
        paths.push(a.path as string);
        if (failing.load) throw new Error('The settings file is unreadable');
        return 1;
      case 'plugin:store|get':
        return [data.get(a.key as string) ?? null, data.has(a.key as string)];
      case 'plugin:store|set':
        data.set(a.key as string, a.value);
        return null;
      case 'plugin:store|save': {
        const write = () => {
          if (failing.save) throw new Error('The disk is full');
          saves.push(Object.fromEntries(data));
          return null;
        };
        return gate.hold ? gate.hold.then(write) : write();
      }
      default:
        return others(cmd, args);
    }
  });

  return { data, saves, paths, failing, gate };
}
