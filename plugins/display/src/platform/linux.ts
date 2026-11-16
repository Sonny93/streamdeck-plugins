import { onceAsync } from 'deck-kit/async/once_async';

import type { DisplaySystem } from '../displays/display_system';
import { createLinuxDisplaySystem } from '../linux/create_linux_display_system';

/** Binds the Linux monitor adapter, once; it uses command line tools only, so no native module is loaded. */
export function createDisplaySystemLoader(): () => Promise<DisplaySystem> {
	return onceAsync(() => Promise.resolve(createLinuxDisplaySystem()));
}
