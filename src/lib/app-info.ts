import { parseAttribution } from '$lib/components/shell';
import attributionHtml from '../../logo-attribution.txt?raw';
// The CSP has no data: in img-src, so the logo must stay a file and not inline.
import logo from '../assets/logo.png?no-inline';

// What the sidebar and Settings, Info show. The logo credit comes from
// logo-attribution.txt at the project root, as Flaticon hands it out.
export const appInfo = {
  name: 'Allies',
  description: 'Stay on top of your personal relationships and obligations.',
  logo,
  attribution: parseAttribution(attributionHtml),
};
