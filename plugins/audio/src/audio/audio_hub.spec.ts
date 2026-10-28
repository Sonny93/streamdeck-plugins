import { describe, expect, it, vi } from 'vitest';

import { AudioDeviceUnavailableError } from './audio_device_unavailable_error';
import { AudioHub } from './audio_hub';
import type { AudioSnapshot } from './audio_snapshot';
import { buildAudioDevice } from './build_audio_device';
import { FakeCoreAudio } from './fake_core_audio';

const POLL_INTERVAL_MILLISECONDS = 500;
const VOLUME_STEP = 0.02;

function createHub(coreAudio: FakeCoreAudio) {
	const scheduled: Array<() => void> = [];
	const cancelPoll = vi.fn();
	const onError = vi.fn();
	const hub = new AudioHub({
		loadCoreAudio: () => Promise.resolve(coreAudio),
		schedule: (callback) => {
			scheduled.push(callback);
			return cancelPoll;
		},
		pollIntervalMilliseconds: POLL_INTERVAL_MILLISECONDS,
		volumeStep: VOLUME_STEP,
		onError,
	});
	return { hub, scheduled, cancelPoll, onError };
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

		coreAudio.setMute('microphone', true);
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
		expect(coreAudio.readVolume('microphone').isMuted).toBe(true);

		await hub.toggleMute(target);
		expect(coreAudio.readVolume('microphone').isMuted).toBe(false);
	});

	it('moves the volume by steps within bounds and unmutes the device', async () => {
		const coreAudio = createCoreAudio();
		coreAudio.setMute('speakers', true);
		const { hub } = createHub(coreAudio);
		const target = { kind: 'device', deviceId: 'speakers' } as const;

		await hub.changeVolume(target, 3);
		expect(coreAudio.readVolume('speakers')).toEqual({
			level: 0.36,
			isMuted: false,
		});

		await hub.changeVolume(target, -50);
		expect(coreAudio.readVolume('speakers').level).toBe(0);
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

		vi.spyOn(coreAudio, 'listDevices').mockImplementation(() => {
			throw new Error('COM failure');
		});
		await hub.refresh();

		expect(hub.current).toBeUndefined();
		expect(onError).toHaveBeenCalledOnce();
	});
});
