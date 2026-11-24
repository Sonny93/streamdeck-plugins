import { createFakeScheduler } from 'deck-kit/async/create_fake_scheduler';
import type { GlobalSettingsPort } from 'deck-kit/settings/global_settings_port';
import { describe, expect, it, vi } from 'vitest';

import { buildListenSource, REAR_MIC_ID } from './build_listen_source';
import { buildLoopback } from './build_loopback';
import { createFakeGlobalSettings } from './create_fake_global_settings';
import { createFakeSourceListening } from './create_fake_source_listening';
import { ListenHub } from './listen_hub';
import { ListenSourceCutError } from './listen_source_cut_error';
import { ListenTiming } from './listen_timing';

const CEILING = 0.2;

function NEVER_SETTLES(): void {
	return undefined;
}

function createSetup(
	initialSettings: unknown = {},
	settingsPort?: GlobalSettingsPort
) {
	const fake = createFakeSourceListening([buildListenSource()]);
	const settings = createFakeGlobalSettings(initialSettings);
	const scheduler = createFakeScheduler();
	const onError = vi.fn();
	const onCut = vi.fn();
	const hub = new ListenHub({
		listening: fake.listening,
		settings: settingsPort ?? settings.port,
		schedule: scheduler.schedule,
		onError,
	});
	hub.subscribeToCuts(onCut);
	return { fake, settings, scheduler, onError, onCut, hub };
}

function callsNamed(
	calls: ReturnType<typeof createSetup>['fake']['calls'],
	name: string
) {
	return calls.filter((call) => call.name === name);
}

function levelsSet(
	setup: ReturnType<typeof createSetup>
): (number | undefined)[] {
	return callsNamed(setup.fake.calls, 'setLevel').map((call) => call.level);
}

async function createListening(initialSettings: unknown = {}) {
	const setup = createSetup(initialSettings);
	await setup.hub.start();
	await setup.hub.toggle(REAR_MIC_ID, CEILING);
	return setup;
}

function findCutError(onError: ReturnType<typeof vi.fn>) {
	return onError.mock.calls
		.map(([error]) => error)
		.find((error) => error instanceof ListenSourceCutError);
}

describe('ListenHub', () => {
	it('should start at the remembered level held under the ceiling when it toggles a source that is not listened', async () => {
		const { hub, fake } = createSetup({ listenLevels: { [REAR_MIC_ID]: 0.5 } });
		await hub.start();

		await hub.toggle(REAR_MIC_ID, CEILING);

		expect(callsNamed(fake.calls, 'startListening')).toEqual([
			{ name: 'startListening', sourceId: REAR_MIC_ID, level: CEILING },
		]);
	});

	it('should stop listening when it toggles a listened source', async () => {
		const { hub, fake } = await createListening();

		await hub.toggle(REAR_MIC_ID, CEILING);

		expect(callsNamed(fake.calls, 'stopListening')).toHaveLength(1);
		expect(hub.current?.listenedSourceIds.has(REAR_MIC_ID)).toBe(false);
	});

	it('should run two quick toggles one after the other when the second sees the first', async () => {
		const { hub, fake } = createSetup();
		await hub.start();

		await Promise.all([
			hub.toggle(REAR_MIC_ID, CEILING),
			hub.toggle(REAR_MIC_ID, CEILING),
		]);

		expect(
			fake.calls.map((call) => call.name).filter((name) => name !== 'readState')
		).toEqual(['startListening', 'stopListening']);
	});

	it('should never start listening when the hub starts', async () => {
		const { hub, fake } = createSetup({ listenLevels: { [REAR_MIC_ID]: 0.1 } });

		await hub.start();

		expect(callsNamed(fake.calls, 'startListening')).toHaveLength(0);
	});

	it('should make no listening call and change the level when it rotates a source that is not listened', async () => {
		const { hub, fake, scheduler } = createSetup();
		await hub.start();
		const callCount = fake.calls.length;

		hub.changeLevel(REAR_MIC_ID, 2, CEILING);
		await scheduler.settle();

		expect(fake.calls).toHaveLength(callCount);
		expect(hub.levelOf(REAR_MIC_ID, CEILING)).toBe(0.09);
	});

	it('should hold the level under the ceiling when it rotates up', async () => {
		const { hub } = createSetup();

		hub.changeLevel(REAR_MIC_ID, 1000, CEILING);

		expect(hub.levelOf(REAR_MIC_ID, CEILING)).toBe(CEILING);
	});

	it('should hold the level at zero when it rotates down', async () => {
		const { hub } = createSetup();

		hub.changeLevel(REAR_MIC_ID, -1000, CEILING);

		expect(hub.levelOf(REAR_MIC_ID, CEILING)).toBe(0);
	});

	it('should climb one step per interval and end at the latest target when it rotates up fast', async () => {
		const setup = await createListening();

		setup.hub.changeLevel(REAR_MIC_ID, 3, CEILING);
		await setup.scheduler.settle();
		expect(levelsSet(setup)).toEqual([0.085]);
		await setup.scheduler.advance(ListenTiming.upwardStepIntervalMilliseconds);
		expect(levelsSet(setup)).toEqual([0.085, 0.09]);
		await setup.scheduler.advance(ListenTiming.upwardStepIntervalMilliseconds);
		await setup.scheduler.advance(ListenTiming.upwardStepIntervalMilliseconds);

		expect(levelsSet(setup)).toEqual([0.085, 0.09, 0.095]);
	});

	it('should apply the target at once when it rotates down', async () => {
		const setup = await createListening();

		setup.hub.changeLevel(REAR_MIC_ID, -4, CEILING);
		await setup.scheduler.settle();

		expect(levelsSet(setup)).toEqual([0.06]);
	});

	it('should cut the source when its level rises above the allowed level', async () => {
		const setup = await createListening();

		setup.fake.state.sources = [buildListenSource({ loudestLevel: 0.5 })];
		setup.fake.emitChange();
		await setup.scheduler.settle();

		expect(callsNamed(setup.fake.calls, 'stopListening')).toHaveLength(1);
		expect(setup.onCut).toHaveBeenCalledWith(REAR_MIC_ID);
		expect(findCutError(setup.onError)).toMatchObject({
			code: 'E_LISTEN_SOURCE_CUT',
			reason: 'level-raised',
		});
	});

	it('should cut the source when its port changes', async () => {
		const setup = await createListening();

		setup.fake.state.sources = [
			buildListenSource({ activePort: 'analog-input-front-mic' }),
		];
		setup.fake.emitChange();
		await setup.scheduler.settle();

		expect(setup.onCut).toHaveBeenCalledWith(REAR_MIC_ID);
		expect(findCutError(setup.onError)).toMatchObject({
			reason: 'port-changed',
		});
	});

	it('should cut the source when it vanishes', async () => {
		const setup = await createListening();

		setup.fake.state.sources = [];
		setup.fake.emitChange();
		await setup.scheduler.settle();

		expect(callsNamed(setup.fake.calls, 'stopListening')).toHaveLength(1);
		expect(findCutError(setup.onError)).toMatchObject({
			reason: 'source-gone',
		});
	});

	it('should not cut the source when a read comes while a lower level is being applied', async () => {
		const setup = await createListening();
		let openGate: () => void = () => undefined;
		setup.fake.controls.setLevelGate = new Promise((resolve) => {
			openGate = resolve;
		});

		setup.hub.changeLevel(REAR_MIC_ID, -10, CEILING);
		await setup.scheduler.settle();
		setup.fake.emitChange();
		await setup.scheduler.settle();
		openGate();
		await setup.scheduler.settle();

		expect(callsNamed(setup.fake.calls, 'stopListening')).toHaveLength(0);
		expect(setup.hub.current?.listenedSourceIds.has(REAR_MIC_ID)).toBe(true);
	});

	it('should guard a loopback loaded by hand when it sees it for the first time', async () => {
		const setup = createSetup();
		setup.fake.state.loopbacks = [buildLoopback()];
		await setup.hub.start();

		setup.fake.state.sources = [buildListenSource({ loudestLevel: 1 })];
		setup.fake.emitChange();
		await setup.scheduler.settle();

		expect(callsNamed(setup.fake.calls, 'stopListening')).toHaveLength(1);
		expect(setup.onCut).toHaveBeenCalledWith(REAR_MIC_ID);
	});

	it('should keep watching without a view listener while a loopback is loaded', async () => {
		const setup = createSetup();
		await setup.hub.start();
		const unsubscribe = setup.hub.subscribe(() => undefined);
		await setup.hub.toggle(REAR_MIC_ID, CEILING);

		unsubscribe();

		expect(setup.fake.watcherCount()).toBe(1);
	});

	it('should stop watching when no loopback remains and no one listens', async () => {
		const setup = createSetup();
		await setup.hub.start();
		const unsubscribe = setup.hub.subscribe(() => undefined);
		await setup.hub.toggle(REAR_MIC_ID, CEILING);
		unsubscribe();

		await setup.hub.toggle(REAR_MIC_ID, CEILING);

		expect(setup.fake.watcherCount()).toBe(0);
		expect(setup.scheduler.pendingCount()).toBe(0);
	});

	it('should cut the source when a level change fails while it is listened', async () => {
		const setup = await createListening();
		setup.fake.controls.setLevelError = new Error('level not applied');

		setup.hub.changeLevel(REAR_MIC_ID, -2, CEILING);
		await setup.scheduler.settle();

		expect(callsNamed(setup.fake.calls, 'stopListening')).toHaveLength(1);
		expect(setup.onCut).toHaveBeenCalledWith(REAR_MIC_ID);
		expect(findCutError(setup.onError)).toMatchObject({
			reason: 'level-change-failed',
		});
	});

	it('should save the remembered levels once after a burst and keep the other settings', async () => {
		const setup = createSetup({ language: 'fr', host: 'unit' });
		await setup.hub.start();

		setup.hub.changeLevel(REAR_MIC_ID, 1, CEILING);
		await setup.scheduler.advance(100);
		setup.hub.changeLevel(REAR_MIC_ID, 1, CEILING);
		await setup.scheduler.advance(100);
		setup.hub.changeLevel(REAR_MIC_ID, 1, CEILING);
		expect(setup.settings.writes).toHaveLength(0);
		await setup.scheduler.advance(ListenTiming.levelSaveDelayMilliseconds);

		expect(setup.settings.writes).toEqual([
			{ language: 'fr', host: 'unit', listenLevels: { [REAR_MIC_ID]: 0.095 } },
		]);
	});

	it('should ignore remembered levels that cannot be read when the hub starts', async () => {
		const { hub } = createSetup({ listenLevels: { [REAR_MIC_ID]: 'loud' } });

		await hub.start();

		expect(hub.levelOf(REAR_MIC_ID, CEILING)).toBe(ListenTiming.defaultLevel);
	});

	it('should have no view and report the error when the read fails', async () => {
		const fake = createFakeSourceListening([buildListenSource()]);
		const onError = vi.fn();
		const hub = new ListenHub({
			listening: {
				...fake.listening,
				readState: () => Promise.reject(new Error('pactl')),
			},
			settings: createFakeGlobalSettings({}).port,
			schedule: createFakeScheduler().schedule,
			onError,
		});

		await hub.start();

		expect(hub.current).toBeUndefined();
		expect(onError).toHaveBeenCalledOnce();
	});

	it('should unload an owned loopback by index and cut when it gets relinked to another source', async () => {
		const setup = await createListening();
		setup.fake.state.sources = [
			buildListenSource(),
			buildListenSource({ id: 'alsa_input.line', loudestLevel: 1 }),
		];
		setup.fake.state.loopbacks = setup.fake.state.loopbacks.map((loopback) => ({
			...loopback,
			linkedSourceId: 'alsa_input.line',
		}));

		setup.fake.emitChange();
		await setup.scheduler.settle();

		expect(callsNamed(setup.fake.calls, 'unloadLoopback')).toEqual([
			{ name: 'unloadLoopback', moduleIndex: 1 },
		]);
		expect(setup.onCut).toHaveBeenCalledWith(REAR_MIC_ID);
		expect(findCutError(setup.onError)).toMatchObject({
			reason: 'loopback-relinked',
		});
		expect(setup.hub.current?.listenedSourceIds.size).toBe(0);
		expect(callsNamed(setup.fake.calls, 'stopListening')).toHaveLength(0);
	});

	it('should unload a tagged loopback it does not own when the hub starts', async () => {
		const setup = createSetup();
		setup.fake.state.loopbacks = [
			buildLoopback({ moduleIndex: 7, isPluginLoopback: true }),
		];

		await setup.hub.start();

		expect(callsNamed(setup.fake.calls, 'unloadLoopback')).toEqual([
			{ name: 'unloadLoopback', moduleIndex: 7 },
		]);
		expect(setup.onError).toHaveBeenCalledWith(
			expect.objectContaining({ code: 'E_LISTEN_STRAY_LOOPBACK' })
		);
		expect(setup.hub.current?.listenedSourceIds.size).toBe(0);
	});

	it('should unload an owned loopback when its stream level is above 100 %', async () => {
		const setup = await createListening();
		setup.fake.state.loopbacks = setup.fake.state.loopbacks.map((loopback) => ({
			...loopback,
			playbackLevel: 1.2,
		}));

		setup.fake.emitChange();
		await setup.scheduler.settle();

		expect(callsNamed(setup.fake.calls, 'unloadLoopback')).toHaveLength(1);
		expect(findCutError(setup.onError)).toMatchObject({
			reason: 'stream-too-loud',
		});
	});

	it('should keep a hand-loaded loopback listened when it looks fine', async () => {
		const setup = createSetup();
		setup.fake.state.loopbacks = [buildLoopback()];

		await setup.hub.start();

		expect(setup.hub.current?.listenedSourceIds.has(REAR_MIC_ID)).toBe(true);
		expect(callsNamed(setup.fake.calls, 'unloadLoopback')).toHaveLength(0);
	});

	it('should lower the remembered level and the live level when it enforces a lower ceiling on a listened source', async () => {
		const setup = await createListening({
			listenLevels: { [REAR_MIC_ID]: 0.15 },
		});

		setup.hub.enforceCeiling(REAR_MIC_ID, 0.1);
		await setup.scheduler.settle();

		expect(setup.hub.levelOf(REAR_MIC_ID, 1)).toBe(0.1);
		expect(levelsSet(setup)).toEqual([0.1]);
	});

	it('should change nothing when it enforces a ceiling above the remembered level', async () => {
		const setup = await createListening({
			listenLevels: { [REAR_MIC_ID]: 0.15 },
		});

		setup.hub.enforceCeiling(REAR_MIC_ID, 0.3);
		await setup.scheduler.settle();

		expect(setup.hub.levelOf(REAR_MIC_ID, 1)).toBe(0.15);
		expect(levelsSet(setup)).toEqual([]);
	});

	it('should still toggle and cut when a settings write never resolves', async () => {
		const stuckPort: GlobalSettingsPort = {
			read: () => Promise.resolve({}),
			write: () => new Promise<void>(NEVER_SETTLES),
		};
		const setup = createSetup({}, stuckPort);
		await setup.hub.start();
		setup.hub.changeLevel(REAR_MIC_ID, 1, CEILING);
		await setup.scheduler.advance(ListenTiming.levelSaveDelayMilliseconds);

		await setup.hub.toggle(REAR_MIC_ID, CEILING);
		setup.fake.state.sources = [buildListenSource({ loudestLevel: 1 })];
		setup.fake.emitChange();
		await setup.scheduler.settle();

		expect(setup.onCut).toHaveBeenCalledWith(REAR_MIC_ID);
	});

	it('should keep polling after a failed read when nothing else needs it', async () => {
		const fake = createFakeSourceListening([buildListenSource()]);
		const scheduler = createFakeScheduler();
		const readState = vi.fn(() => Promise.reject(new Error('pactl')));
		const hub = new ListenHub({
			listening: { ...fake.listening, readState },
			settings: createFakeGlobalSettings({}).port,
			schedule: scheduler.schedule,
			onError: vi.fn(),
		});
		await hub.start();

		await scheduler.advance(ListenTiming.safetyPollIntervalMilliseconds);

		expect(readState).toHaveBeenCalledTimes(2);
	});

	it('should own nothing and adopt the hand loopback when it toggles a source that only has a hand loopback', async () => {
		const setup = createSetup();
		setup.fake.state.loopbacks = [buildLoopback()];

		await setup.hub.toggle(REAR_MIC_ID, CEILING);

		expect(setup.hub.ownedModuleIndexes).toEqual([]);
		expect(setup.hub.current?.listenedSourceIds.has(REAR_MIC_ID)).toBe(true);
	});

	it('should adopt a hand loopback whose requested source is unknown when it is linked to a source', async () => {
		const setup = createSetup();
		setup.fake.state.loopbacks = [
			buildLoopback({ requestedSourceId: undefined }),
		];

		await setup.hub.start();

		expect(setup.hub.current?.listenedSourceIds.has(REAR_MIC_ID)).toBe(true);
		expect(callsNamed(setup.fake.calls, 'unloadLoopback')).toHaveLength(0);
	});
});
