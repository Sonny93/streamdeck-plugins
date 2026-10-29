import vm from 'node:vm';
import { vi } from 'vitest';

import type { SpotifySession } from './spotify_session';

type SendParams = Readonly<Record<string, unknown>> | undefined;

/**
 * Test helper: builds a session whose page evaluates expressions in a fake Spotify page
 * exposing the given services through a platform registry, plus `platformExtras` on the platform itself (like its transport).
 */
export function buildFakePlatformSession(
	services: Readonly<Record<string, unknown>>,
	platformExtras: Readonly<Record<string, unknown>> = {}
) {
	const registryMap = new Map<symbol, unknown>();
	for (const [name, service] of Object.entries(services)) {
		registryMap.set(Symbol(name), service);
	}
	const registry = {
		_map: registryMap,
		resolve: (key: symbol): unknown => registryMap.get(key),
	};
	const platform = { ...platformExtras, getRegistry: () => registry };
	const root = { __reactContainerFake: { memoizedProps: { platform } } };
	const context = vm.createContext({
		window: {},
		document: { getElementById: () => root },
		setTimeout: (callback: () => void, delay: number) =>
			setTimeout(callback, delay),
	});
	const send = vi.fn(
		async (_method: string, params?: SendParams): Promise<unknown> => {
			const expression = params?.['expression'];
			if (typeof expression !== 'string') {
				throw new TypeError('expected an expression string');
			}
			const value: unknown = await vm.runInContext(expression, context);
			return { result: { value } };
		}
	);
	const connection = { send, close: vi.fn() };
	const session: SpotifySession = {
		browser: connection,
		page: connection,
		pageTargetId: 'target-1',
		launchedByPlugin: false,
	};
	return { session, send };
}
