import type koffiModule from 'koffi';

import { onceAsync } from '../shared/once_async';

/**
 * Imports koffi lazily, once.
 * The native addon is imported on first use so a missing koffi cannot prevent the plugin from starting.
 */
export const loadKoffi = onceAsync(
	async (): Promise<typeof koffiModule> => (await import('koffi')).default
);
