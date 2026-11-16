import type { ApiFamily } from '../unit_types';

export function resolveApiFamily(moduleType: string): ApiFamily {
	if (moduleType === 'aircon') return 'local-http';
	if (moduleType === 'GPF') return 'cloud-only';
	return 'unknown';
}
