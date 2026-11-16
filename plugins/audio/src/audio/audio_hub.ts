import { AudioDeviceUnavailableError } from './audio_device_unavailable_error';
import type { AudioHubOptions } from './audio_hub_options';
import type { AudioSnapshot } from './audio_snapshot';
import type { AudioTarget } from './audio_target';
import type { CoreAudio } from './core_audio';
import { describeAudioTarget } from './describe_audio_target';
import { isSameAudioSnapshot } from './is_same_audio_snapshot';

type AudioSnapshotListener = (snapshot: AudioSnapshot | undefined) => void;

type PendingVolumeChange = { steps: number; done: Promise<void> };

/**
 * Shares the state of the audio devices between every action.
 * It reads the devices at a fixed interval while someone listens, and again when the platform reports a change,
 * so changes made outside the plugin show up, and reads them again right after each change it makes.
 * Changes run one at a time, and the dial ticks that arrive while one waits are summed into a single volume change.
 */
export class AudioHub {
	private readonly listeners = new Set<AudioSnapshotListener>();
	private readonly pendingVolumeChanges = new Map<
		string,
		PendingVolumeChange
	>();
	private snapshot: AudioSnapshot | undefined;
	private cancelPoll: (() => void) | undefined;
	private stopWatching: (() => void) | undefined;
	private cancelDebounce: (() => void) | undefined;
	private lastChange: Promise<unknown> = Promise.resolve();
	private lastRefresh: Promise<unknown> = Promise.resolve();
	private queuedRefresh: Promise<AudioSnapshot | undefined> | undefined;

	constructor(private readonly options: AudioHubOptions) {}

	/** Latest snapshot, `undefined` before the first read or while the devices cannot be read. */
	get current(): AudioSnapshot | undefined {
		return this.snapshot;
	}

	/** Registers a listener and calls it right away; the first listener starts the polling and the last one stops it. */
	subscribe(listener: AudioSnapshotListener): () => void {
		this.listeners.add(listener);
		listener(this.snapshot);
		if (this.cancelPoll === undefined) {
			this.start();
		}
		return () => {
			this.listeners.delete(listener);
			if (this.listeners.size === 0) {
				this.stop();
			}
		};
	}

	/** Reads the devices now, after the reads already asked, and tells the listeners when something changed. */
	refresh(): Promise<AudioSnapshot | undefined> {
		if (this.queuedRefresh !== undefined) {
			return this.queuedRefresh;
		}
		const read = this.lastRefresh.then(() => {
			this.queuedRefresh = undefined;
			return this.readAndPublish();
		});
		this.queuedRefresh = read;
		this.lastRefresh = read;
		return read;
	}

	async setDefaultDevice(target: AudioTarget): Promise<void> {
		await this.enqueue(() =>
			this.applyChange(target, (coreAudio, deviceId) =>
				coreAudio.setDefaultDevice(deviceId)
			)
		);
		await this.refresh();
	}

	async toggleMute(target: AudioTarget): Promise<void> {
		await this.enqueue(() =>
			this.applyChange(target, (coreAudio, deviceId) =>
				coreAudio.toggleMute(deviceId)
			)
		);
		await this.refresh();
	}

	/** Moves the volume by a number of steps (negative to lower it), unmuting the device; steps asked while a change waits are added to it. */
	async changeVolume(target: AudioTarget, steps: number): Promise<void> {
		const key = describeAudioTarget(target);
		const pending = this.pendingVolumeChanges.get(key);
		if (pending === undefined) {
			const created: PendingVolumeChange = {
				steps,
				done: Promise.resolve(),
			};
			created.done = this.enqueue(() => {
				this.pendingVolumeChanges.delete(key);
				return this.applyChange(target, (coreAudio, deviceId) =>
					coreAudio.moveVolume(
						deviceId,
						created.steps * this.options.volumeStep
					)
				);
			});
			this.pendingVolumeChanges.set(key, created);
			await created.done;
		} else {
			pending.steps += steps;
			await pending.done;
		}
		await this.refresh();
	}

	private enqueue(change: () => Promise<void>): Promise<void> {
		const queued = this.lastChange.then(change);
		this.lastChange = queued.catch(() => undefined);
		return queued;
	}

	private async applyChange(
		target: AudioTarget,
		apply: (coreAudio: CoreAudio, deviceId: string) => Promise<void>
	): Promise<void> {
		const coreAudio = await this.options.loadCoreAudio();
		const deviceId =
			target.kind === 'default'
				? await coreAudio.readDefaultDeviceId(target.flow)
				: target.deviceId;
		if (deviceId === undefined) {
			throw new AudioDeviceUnavailableError();
		}
		await apply(coreAudio, deviceId);
	}

	private async readAndPublish(): Promise<AudioSnapshot | undefined> {
		try {
			const coreAudio = await this.options.loadCoreAudio();
			this.publish(await coreAudio.readSnapshot());
		} catch (error) {
			this.options.onError(error);
			this.publish(undefined);
		}
		return this.snapshot;
	}

	private start(): void {
		this.poll();
		this.stopWatching = this.options.watchChanges?.(() => {
			this.refreshSoon();
		});
	}

	private stop(): void {
		this.cancelPoll?.();
		this.cancelPoll = undefined;
		this.stopWatching?.();
		this.stopWatching = undefined;
		this.cancelDebounce?.();
		this.cancelDebounce = undefined;
	}

	private poll(): void {
		void this.refresh();
		this.cancelPoll = this.options.schedule(() => {
			this.poll();
		}, this.options.pollIntervalMilliseconds);
	}

	private refreshSoon(): void {
		if (this.cancelDebounce !== undefined) {
			return;
		}
		this.cancelDebounce = this.options.schedule(() => {
			this.cancelDebounce = undefined;
			void this.refresh();
		}, this.options.changeDebounceMilliseconds);
	}

	private publish(snapshot: AudioSnapshot | undefined): void {
		if (isSameAudioSnapshot(this.snapshot, snapshot)) {
			return;
		}
		this.snapshot = snapshot;
		for (const listener of this.listeners) {
			listener(snapshot);
		}
	}
}
