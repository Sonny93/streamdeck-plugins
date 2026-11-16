import { createUnsupportedAdapters } from './create_unsupported_adapters';
import type { PlatformAdapters } from './platform_adapters';

/**
 * Picks the adapters of the running system with a dynamic import, so the modules of the other systems
 * (and koffi, which only Windows needs) are never loaded.
 */
export async function loadPlatformAdapters(
	platform: NodeJS.Platform,
	onUnsupported: (platform: string) => void
): Promise<PlatformAdapters> {
	if (platform === 'win32') {
		return (await import('./windows')).windowsAdapters;
	}
	if (platform === 'linux') {
		return (await import('./linux')).linuxAdapters;
	}
	onUnsupported(platform);
	return createUnsupportedAdapters(platform);
}
