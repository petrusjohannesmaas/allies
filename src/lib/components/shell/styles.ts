// Class strings shared by the sidebar, the header and the settings tabs. The
// accent shows as a light tint behind the icon and as `--accent-text` on it,
// never as a solid fill. `--accent-text` is the accent made darker in Light
// and lighter in Dark, so it reads on the grey sidebar and on the page.

/** A 48 px square icon button in the sidebar. Add exactly one of the two below. */
export const sidebarButton =
  'relative flex size-12 cursor-pointer items-center justify-center rounded-2xl transition-colors';

/** A sidebar button for a page that is not open. */
export const sidebarButtonIdle =
  'text-muted-foreground hover:bg-(color:--accent-bg)/12 hover:text-(color:--accent-text)';

/**
 * A sidebar button for the page that is open. It never sits beside the idle
 * classes: two text colours on one element resolve by Tailwind's CSS order,
 * not by the order in the class list, and the grey would win.
 */
export const sidebarButtonCurrent = 'bg-(color:--accent-bg)/18 text-(color:--accent-text)';

/** A round 40 px icon button in the home header. It grows sideways when it holds text. */
export const headerButton =
  'inline-flex h-10 min-w-10 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2.5 text-muted-foreground transition-colors hover:bg-(color:--accent-bg)/12 hover:text-(color:--accent-text)';
