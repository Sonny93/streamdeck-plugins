import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

import { SpotifyPlatformBinding } from './spotify_platform_binding';
import { buildPlatformExpression } from './build_platform_expression';

const FIBER_NODE_CAP = 200_000;

type Fiber = {
	memoizedProps?: { platform?: unknown };
	child?: Fiber;
	sibling?: Fiber;
};

function buildPlatform(services: Readonly<Record<string, unknown>>) {
	const registryMap = new Map<symbol, unknown>();
	for (const [name, service] of Object.entries(services)) {
		registryMap.set(Symbol(name), service);
	}
	const registry = {
		_map: registryMap,
		resolve: (key: symbol): unknown => registryMap.get(key),
	};
	return { getRegistry: () => registry };
}

function buildFiberWithPlatform(platform: unknown): Fiber {
	return { memoizedProps: { platform } };
}

function buildFakePage(rootFiber: Fiber | undefined) {
	let rootLookupCount = 0;
	const root =
		rootFiber === undefined ? null : { __reactContainerFake: rootFiber };
	const window: Record<string, unknown> = {};
	const context = vm.createContext({
		window,
		document: {
			getElementById: () => {
				rootLookupCount += 1;
				return root;
			},
		},
	});
	return {
		window,
		readRootLookupCount: (): number => rootLookupCount,
		evaluate: (body: string): Promise<unknown> =>
			vm.runInContext(buildPlatformExpression(body), context),
	};
}

describe('buildPlatformExpression', () => {
	it('should return the value produced by the body', async () => {
		const platform = buildPlatform({ PlayerAPI: { answer: 42 } });
		const page = buildFakePage(buildFiberWithPlatform(platform));

		const outcome = await page.evaluate("return resolve('PlayerAPI').answer;");

		expect(outcome).toEqual({ status: 'ok', value: 42 });
	});

	it('should return an ok status without value when the body returns nothing', async () => {
		const platform = buildPlatform({});
		const page = buildFakePage(buildFiberWithPlatform(platform));

		const outcome = await page.evaluate('');

		expect(outcome).toEqual({ status: 'ok' });
	});

	it('should await the body', async () => {
		const platform = buildPlatform({});
		const page = buildFakePage(buildFiberWithPlatform(platform));

		const outcome = await page.evaluate(
			'return await Promise.resolve("done");'
		);

		expect(outcome).toEqual({ status: 'ok', value: 'done' });
	});

	it('should find the platform in a descendant of a sibling', async () => {
		const platform = buildPlatform({ PlayerAPI: { answer: 7 } });
		const rootFiber: Fiber = {
			child: { sibling: { child: buildFiberWithPlatform(platform) } },
		};
		const page = buildFakePage(rootFiber);

		const outcome = await page.evaluate("return resolve('PlayerAPI').answer;");

		expect(outcome).toEqual({ status: 'ok', value: 7 });
	});

	it('should cache the found platform on the window', async () => {
		const platform = buildPlatform({});
		const page = buildFakePage(buildFiberWithPlatform(platform));

		await page.evaluate('');

		expect(page.window[SpotifyPlatformBinding.guardProperty]).toBe(platform);
	});

	it('should reuse the cached platform without walking the page again', async () => {
		const platform = buildPlatform({});
		const page = buildFakePage(buildFiberWithPlatform(platform));
		await page.evaluate('');

		await page.evaluate('');

		expect(page.readRootLookupCount()).toBe(1);
	});

	it('should report platform-not-found when the root element is missing', async () => {
		const page = buildFakePage(undefined);

		const outcome = await page.evaluate('');

		expect(outcome).toEqual({ status: 'platform-not-found' });
	});

	it('should report platform-not-found when no fiber carries a platform', async () => {
		const page = buildFakePage({ child: { memoizedProps: {} } });

		const outcome = await page.evaluate('');

		expect(outcome).toEqual({ status: 'platform-not-found' });
	});

	it('should stop walking after the node cap', async () => {
		const platform = buildPlatform({});
		const rootFiber: Fiber = {};
		let tail = rootFiber;
		for (let index = 0; index < FIBER_NODE_CAP; index += 1) {
			tail.child = {};
			tail = tail.child;
		}
		tail.memoizedProps = { platform };
		const page = buildFakePage(rootFiber);

		const outcome = await page.evaluate('');

		expect(outcome).toEqual({ status: 'platform-not-found' });
	});

	it('should report service-not-found with the service name', async () => {
		const platform = buildPlatform({});
		const page = buildFakePage(buildFiberWithPlatform(platform));

		const outcome = await page.evaluate("resolve('PlayerAPI');");

		expect(outcome).toEqual({
			status: 'service-not-found',
			service: 'PlayerAPI',
		});
	});

	it('should propagate any other exception thrown by the body', async () => {
		const platform = buildPlatform({});
		const page = buildFakePage(buildFiberWithPlatform(platform));

		await expect(page.evaluate("throw new Error('boom');")).rejects.toThrow(
			'boom'
		);
	});
});
