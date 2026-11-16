import { describe, expect, it, vi } from 'vitest';

import { AudioDeviceUnavailableError } from './audio_device_unavailable_error';
import { AudioHub } from './audio_hub';
import type { AudioHubOptions } from './audio_hub_options';
import type { AudioSnapshot } from './audio_snapshot';
import { buildAudioDevice } from './build_audio_device';
import { FakeCoreAudio } from './fake_core_audio';

const POLL_INTERVAL_MILLISECONDS = 500;
const CHANGE_DEBOUNCE_MILLISECONDS = 100;
const VOLUME_STEP = 0.02;

function flushPromises(): Promise<void> {
	return new Promise((resolve) => {
		setImmediate(resolve);
	});
}

function createHub(
	coreAudio: FakeCoreAudio,
	watchChanges?: AudioHubOptions['watchChanges']
) {
	const scheduled: Array<() => void> = [];
	const delays: number[] = [];
	const cancelPoll = vi.fn();
	const onError = vi.fn();
	const hub = new AudioHub({
		loadCoreAudio: () => Promise.resolve(coreAudio),
		schedule: (callback, delayMilliseconds) => {
			scheduled.push(callback);
			delays.push(delayMilliseconds);
			return cancelPoll;
		},
		pollIntervalMilliseconds: POLL_INTERVAL_MILLISECONDS,
		changeDebounceMilliseconds: CHANGE_DEBOUNCE_MILLISECONDS,
		volumeStep: VOLUME_STEP,
		watchChanges,
		onError,
	});
	return { hub, scheduled, delays, cancelPoll, onError };
}

function createCoreAudio(): FakeCoreAudio {
	const coreAudio = new FakeCoreAudio();
	coreAudio.plug(buildAudioDevice('headphones'), {
		level: 0.5,
		isMuted: false,
	});
	coreAudio.plug(buildAudioDevice('speakers'), { level: 0.3, isMuted: false });
	coreAudio.plug(buildAudioDevice('microphone', 'input'), {
		level: 0.8,
		isMuted: false,
	});
	return coreAudio;
}

describe('AudioHub', () => {
	it('reads the devices once someone listens, then at every poll', async () => {
		const coreAudio = createCoreAudio();
		const { hub, scheduled } = createHub(coreAudio);
		const snapshots: Array<AudioSnapshot | undefined> = [];

		hub.subscribe((snapshot) => snapshots.push(snapshot));
		await hub.refresh();
		expect(hub.current?.defaultDeviceIds).toEqual({
			output: 'headphones',
			input: 'microphone',
		});

		await coreAudio.setMute('microphone', true);
		scheduled[0]?.();
		await hub.refresh();
		expect(hub.current?.volumes.microphone?.isMuted).toBe(true);
		expect(snapshots).toHaveLength(3);
	});

	it('stops polling once the last listener leaves', () => {
		const { hub, cancelPoll } = createHub(createCoreAudio());

		const unsubscribeFirst = hub.subscribe(() => undefined);
		const unsubscribeSecond = hub.subscribe(() => undefined);
		unsubscribeFirst();
		expect(cancelPoll).not.toHaveBeenCalled();

		unsubscribeSecond();
		expect(cancelPoll).toHaveBeenCalledOnce();
	});

	it('switches the default device and shows it right away', async () => {
		const { hub } = createHub(createCoreAudio());

		await hub.setDefaultDevice({ kind: 'device', deviceId: 'speakers' });

		expect(hub.current?.defaultDeviceIds.output).toBe('speakers');
	});

	it('mutes and unmutes the default input', async () => {
		const coreAudio = createCoreAudio();
		const { hub } = createHub(coreAudio);
		const target = { kind: 'default', flow: 'input' } as const;

		await hub.toggleMute(target);
		expect((await coreAudio.readVolume('microphone')).isMuted).toBe(true);

		await hub.toggleMute(target);
		expect((await coreAudio.readVolume('microphone')).isMuted).toBe(false);
	});

	it('ends muted, unmuted, muted after three rapid mute toggles', async () => {
		const coreAudio = createCoreAudio();
		const setMute = vi.spyOn(coreAudio, 'setMute');
		const { hub } = createHub(coreAudio);
		const target = { kind: 'default', flow: 'input' } as const;

		await Promise.all([
			hub.toggleMute(target),
			hub.toggleMute(target),
			hub.toggleMute(target),
		]);

		expect(setMute.mock.calls.map(([, isMuted]) => isMuted)).toEqual([
			true,
			false,
			true,
		]);
		expect(hub.current?.volumes.microphone?.isMuted).toBe(true);
	});

	it('moves the volume by steps within bounds and unmutes the device', async () => {
		const coreAudio = createCoreAudio();
		await coreAudio.setMute('speakers', true);
		const { hub } = createHub(coreAudio);
		const target = { kind: 'device', deviceId: 'speakers' } as const;

		await hub.changeVolume(target, 3);
		expect(await coreAudio.readVolume('speakers')).toEqual({
			level: 0.36,
			isMuted: false,
		});

		await hub.changeVolume(target, -50);
		expect((await coreAudio.readVolume('speakers')).level).toBe(0);
	});

	it('adds up every step of rapid volume changes', async () => {
		const coreAudio = createCoreAudio();
		const { hub } = createHub(coreAudio);
		const target = { kind: 'device', deviceId: 'speakers' } as const;

		await Promise.all(
			Array.from({ length: 10 }, () => hub.changeVolume(target, 1))
		);

		expect((await coreAudio.readVolume('speakers')).level).toBe(0.5);
	});

	it('adds up the steps asked while a volume change is being applied', async () => {
		const coreAudio = createCoreAudio();
		const { setVolume } = coreAudio;
		const applied: number[] = [];
		let releaseFirstWrite: () => void = () => undefined;
		const firstWriteGate = new Promise<void>((resolve) => {
			releaseFirstWrite = resolve;
		});
		vi.spyOn(coreAudio, 'setVolume').mockImplementation(
			async (deviceId, level) => {
				applied.push(level);
				if (applied.length === 1) {
					await firstWriteGate;
				}
				await setVolume(deviceId, level);
			}
		);
		const { hub } = createHub(coreAudio);
		const target = { kind: 'device', deviceId: 'speakers' } as const;

		const first = hub.changeVolume(target, 1);
		await flushPromises();
		const others = Array.from({ length: 4 }, () => hub.changeVolume(target, 1));
		releaseFirstWrite();
		await Promise.all([first, ...others]);

		expect(applied).toEqual([0.32, 0.4]);
		expect((await coreAudio.readVolume('speakers')).level).toBe(0.4);
	});

	it('reads the devices after a change notice, once for a burst of notices', async () => {
		let notifyChange: () => void = () => undefined;
		const stopWatching = vi.fn();
		const { hub, scheduled, delays, cancelPoll } = createHub(
			createCoreAudio(),
			(onChange) => {
				notifyChange = onChange;
				return stopWatching;
			}
		);
		const unsubscribe = hub.subscribe(() => undefined);
		await hub.refresh();

		notifyChange();
		notifyChange();
		notifyChange();

		expect(
			delays.filter((delay) => delay === CHANGE_DEBOUNCE_MILLISECONDS)
		).toHaveLength(1);
		scheduled.at(-1)?.();
		await hub.refresh();
		unsubscribe();

		expect(stopWatching).toHaveBeenCalledOnce();
		expect(cancelPoll).toHaveBeenCalledOnce();
	});

	it('refuses to change the default device of a direction that has none', async () => {
		const coreAudio = new FakeCoreAudio();
		coreAudio.plug(buildAudioDevice('headphones'));
		const { hub } = createHub(coreAudio);

		await expect(
			hub.toggleMute({ kind: 'default', flow: 'input' })
		).rejects.toBeInstanceOf(AudioDeviceUnavailableError);
	});

	it('forgets the snapshot when the devices cannot be read', async () => {
		const coreAudio = createCoreAudio();
		const { hub, onError } = createHub(coreAudio);
		await hub.refresh();

		vi.spyOn(coreAudio, 'listDevices').mockRejectedValue(
			new Error('COM failure')
		);
		await hub.refresh();

		expect(hub.current).toBeUndefined();
		expect(onError).toHaveBeenCalledOnce();
	});
});
