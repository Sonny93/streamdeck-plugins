import { SpotifyPlatformStatus } from './spotify_platform_status';
import { SpotifyPlatformBinding } from './spotify_platform_binding';

const MAX_FIBER_NODES = 200_000;

/**
 * Builds the async JavaScript expression that reaches Spotify's internal platform and runs `body` with it.
 * `body` is the body of an `async (resolve, platform) => { ... }` function, where `resolve(serviceName)` returns the
 * registered service and `platform` is the platform itself, for what is not a service (like its transport).
 * The expression returns a `{ status, ... }` envelope: the platform is cached on `window`,
 * a missing platform or service is reported through the status, and any other exception propagates.
 */
export function buildPlatformExpression(body: string): string {
	return `(async () => {
		const guardProperty = ${JSON.stringify(SpotifyPlatformBinding.guardProperty)};
		const serviceNotFoundMarker = Symbol('service-not-found');
		const hasRegistry = (candidate) =>
			Boolean(candidate) && typeof candidate.getRegistry === 'function';
		const findPlatform = () => {
			const root = document.getElementById('main');
			if (!root) { return null; }
			const key = Object.keys(root).find((name) => name.startsWith('__reactContainer'));
			if (!key || !root[key]) { return null; }
			const pending = [root[key]];
			let visited = 0;
			while (pending.length > 0 && visited < ${MAX_FIBER_NODES}) {
				const fiber = pending.pop();
				visited += 1;
				const candidate = fiber.memoizedProps && fiber.memoizedProps.platform;
				if (hasRegistry(candidate)) { return candidate; }
				if (fiber.sibling) { pending.push(fiber.sibling); }
				if (fiber.child) { pending.push(fiber.child); }
			}
			return null;
		};
		let platform = window[guardProperty];
		if (!hasRegistry(platform)) {
			platform = findPlatform();
			if (!platform) { return { status: ${JSON.stringify(SpotifyPlatformStatus.platformNotFound)} }; }
			window[guardProperty] = platform;
		}
		const resolve = (serviceName) => {
			const registry = platform.getRegistry();
			const symbol = [...registry._map.keys()].find(
				(entry) => typeof entry === 'symbol' && entry.description === serviceName
			);
			if (symbol === undefined) { throw { marker: serviceNotFoundMarker, service: serviceName }; }
			return registry.resolve(symbol);
		};
		const run = async (resolve, platform) => {
			${body}
		};
		try {
			return { status: ${JSON.stringify(SpotifyPlatformStatus.ok)}, value: await run(resolve, platform) };
		} catch (error) {
			if (error && error.marker === serviceNotFoundMarker) {
				return { status: ${JSON.stringify(SpotifyPlatformStatus.serviceNotFound)}, service: error.service };
			}
			throw error;
		}
	})()`;
}
