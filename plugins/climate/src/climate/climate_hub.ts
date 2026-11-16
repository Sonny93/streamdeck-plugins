import { UnitWriteUnconfirmedError } from '../daikin/errors/unit_write_unconfirmed_error';
import type { UnitDriver } from '../daikin/unit_driver';
import type {
	DesiredUnitState,
	SensorReading,
	UnitEnergy,
	UnitState,
	WritableSpecialMode,
} from '../daikin/unit_types';
import { applyPendingPatch } from './apply_pending_patch';
import type { ClimateHubOptions } from './climate_hub_options';
import type { ClimateStatus } from './climate_status';
import { ClimateUnitUnavailableError } from './climate_unit_unavailable_error';
import type { ClimateView } from './climate_view';
import { PatchWriter } from './patch_writer';

type ClimateViewListener = (view: ClimateView) => void;

/**
 * Shares the state of the one air conditioner between every action.
 * It reads the unit at an interval while someone listens, backing off while the unit does not answer,
 * and writes the changes the actions ask for as one coalesced patch, shown right away on top of the last state read.
 */
export class ClimateHub {
	private readonly listeners = new Set<ClimateViewListener>();
	private readonly writer: PatchWriter;
	private host: string | undefined;
	private driver: UnitDriver | undefined;
	private lastState: UnitState | undefined;
	private sensors: SensorReading | undefined;
	private energy: UnitEnergy | undefined;
	private nextEnergyReadAt = 0;
	/** When the last read of the current unit ended, to space the first read after a subscribe. */
	private lastReadFinishedAt: number | undefined;
	private specialWrite: Promise<void> = Promise.resolve();
	/** The special mode write talking to the unit now, so a patch write waits for it. */
	private activeSpecialWrite: Promise<void> | undefined;
	private specialWritesInFlight = 0;
	private isUnreachable = false;
	/** Changes with the address, so the answer of a driver that is gone is ignored. */
	private generation = 0;
	/** Changes when a write ends, so a read that started before it is ignored: it may predate the write. */
	private writeEpoch = 0;
	private pollToken: symbol | undefined;
	private cancelPoll: (() => void) | undefined;
	private pollIntervalMilliseconds: number;

	constructor(private readonly options: ClimateHubOptions) {
		this.pollIntervalMilliseconds = options.pollIntervalMilliseconds;
		this.writer = new PatchWriter({
			schedule: options.schedule,
			write: (patch) => this.writePatch(patch),
			onChange: () => {
				this.notify();
			},
		});
	}

	/** The address of the unit, `undefined` while there is none. */
	get address(): string | undefined {
		return this.host;
	}

	get view(): ClimateView {
		return {
			status: this.resolveStatus(),
			sensors: this.sensors,
			energy: this.energy,
			state:
				this.lastState === undefined
					? undefined
					: this.writer.unsentPatches.reduce(applyPendingPatch, this.lastState),
		};
	}

	/** Replaces the unit, forgetting the state of the previous one; `undefined` leaves the hub without a unit. */
	setHost(host: string | undefined): void {
		if (host === this.host) {
			return;
		}
		this.host = host;
		this.generation += 1;
		this.writer.discardPending(
			new ClimateUnitUnavailableError('The unit address changed')
		);
		this.driver =
			host === undefined ? undefined : this.options.createDriver(host);
		this.lastState = undefined;
		this.sensors = undefined;
		this.energy = undefined;
		this.nextEnergyReadAt = 0;
		this.lastReadFinishedAt = undefined;
		this.isUnreachable = false;
		this.pollIntervalMilliseconds = this.options.pollIntervalMilliseconds;
		this.stopPolling();
		this.startPollingIfListened();
		this.notify();
	}

	/** Registers a listener; the first one starts reading the unit at once, and the last one to leave stops it. */
	subscribe(listener: ClimateViewListener): () => void {
		this.listeners.add(listener);
		this.startPollingIfListened();
		return () => {
			this.listeners.delete(listener);
			if (this.listeners.size === 0) {
				this.stopPolling();
			}
		};
	}

	/**
	 * Asks for a change, written once no other request came for `quietMilliseconds`.
	 * Resolves when the write holding it succeeded, rejects when it failed or when there is no unit.
	 */
	requestChange(
		patch: Readonly<DesiredUnitState>,
		quietMilliseconds: number
	): Promise<void> {
		if (this.driver === undefined) {
			return Promise.reject(
				new ClimateUnitUnavailableError('The unit address is not set')
			);
		}
		return this.writer.request(patch, quietMilliseconds);
	}

	/**
	 * Turns a special mode on or off, written after any pending or running patch and never alongside one.
	 * It is not coalesced. The state it returns becomes the last state; it rejects with the write error after notifying.
	 */
	requestSpecialMode(
		mode: WritableSpecialMode,
		isActive: boolean
	): Promise<void> {
		if (this.driver === undefined) {
			return Promise.reject(
				new ClimateUnitUnavailableError('The unit address is not set')
			);
		}
		this.specialWritesInFlight += 1;
		const previous = this.specialWrite;
		const outcome = (async () => {
			await previous;
			await this.writer.settled();
			const write = this.writeSpecialMode(mode, isActive);
			const tracked = write.then(
				() => undefined,
				() => undefined
			);
			this.activeSpecialWrite = tracked;
			try {
				await write;
			} finally {
				if (this.activeSpecialWrite === tracked) {
					this.activeSpecialWrite = undefined;
				}
			}
		})().finally(() => {
			this.specialWritesInFlight -= 1;
		});
		this.specialWrite = outcome.catch(() => undefined);
		return outcome;
	}

	private async writeSpecialMode(
		mode: WritableSpecialMode,
		isActive: boolean
	): Promise<void> {
		const { driver, generation } = this;
		if (driver === undefined) {
			throw new ClimateUnitUnavailableError('The unit address is not set');
		}
		try {
			const state = await driver.writeSpecialMode(mode, isActive);
			this.writeEpoch += 1;
			if (generation === this.generation) {
				this.lastState = state;
				this.markReachable();
			}
		} catch (error) {
			this.writeEpoch += 1;
			if (error instanceof UnitWriteUnconfirmedError) {
				void this.read();
			}
			this.notify();
			throw error;
		}
		this.notify();
	}

	private resolveStatus(): ClimateStatus {
		if (this.driver === undefined) {
			return 'unconfigured';
		}
		if (this.isUnreachable) {
			return 'unreachable';
		}
		return this.lastState === undefined ? 'loading' : 'ready';
	}

	private async writePatch(patch: DesiredUnitState): Promise<void> {
		await this.activeSpecialWrite;
		const { driver, generation } = this;
		if (driver === undefined) {
			throw new ClimateUnitUnavailableError('The unit address is not set');
		}
		try {
			const state = await driver.writeState(patch);
			this.writeEpoch += 1;
			if (generation === this.generation) {
				this.lastState = state;
				this.markReachable();
			}
		} catch (error) {
			this.writeEpoch += 1;
			if (error instanceof UnitWriteUnconfirmedError) {
				void this.read();
			}
			throw error;
		}
	}

	/** Never rejects: it runs detached from timers. */
	private async read(): Promise<void> {
		const { driver, generation, writeEpoch } = this;
		if (driver === undefined) {
			return;
		}
		try {
			const snapshot = await driver.readSnapshot();
			this.lastReadFinishedAt = this.options.now();
			if (this.isStale(generation, writeEpoch)) {
				return;
			}
			this.lastState = snapshot.state;
			this.sensors = snapshot.sensors;
			this.markReachable();
		} catch (error) {
			this.lastReadFinishedAt = this.options.now();
			if (this.isStale(generation, writeEpoch)) {
				return;
			}
			this.options.onError(error);
			this.isUnreachable = true;
			this.pollIntervalMilliseconds = Math.min(
				this.pollIntervalMilliseconds * 2,
				this.options.maximumPollIntervalMilliseconds
			);
		}
		this.notify();
	}

	private isStale(generation: number, writeEpoch: number): boolean {
		return generation !== this.generation || writeEpoch !== this.writeEpoch;
	}

	private markReachable(): void {
		this.isUnreachable = false;
		this.pollIntervalMilliseconds = this.options.pollIntervalMilliseconds;
	}

	private startPollingIfListened(): void {
		if (
			this.pollToken !== undefined ||
			this.driver === undefined ||
			this.listeners.size === 0
		) {
			return;
		}
		const token = Symbol('poll');
		this.pollToken = token;
		const delay = this.computeFirstPollDelay(this.driver);
		if (delay === 0) {
			this.runPoll(token);
			return;
		}
		this.cancelPoll = this.options.schedule(() => {
			this.runPoll(token);
		}, delay);
	}

	/** The unit gets no read sooner than its minimum interval after the previous one, however often the listeners come and go. */
	private computeFirstPollDelay(driver: UnitDriver): number {
		if (this.lastReadFinishedAt === undefined) {
			return 0;
		}
		const elapsed = this.options.now() - this.lastReadFinishedAt;
		return Math.max(0, driver.hints.minimumPollIntervalMs - elapsed);
	}

	private stopPolling(): void {
		this.pollToken = undefined;
		this.cancelPoll?.();
		this.cancelPoll = undefined;
	}

	/** Reads, then waits the interval before the next read; a poll never starts while a change is pending or being written. */
	private runPoll(token: symbol): void {
		this.cancelPoll = undefined;
		if (this.pollToken !== token) {
			return;
		}
		if (this.hasUnsentChange()) {
			this.scheduleNextPoll(token);
			return;
		}
		void this.read()
			.then(() =>
				this.pollToken === token ? this.readEnergyIfDue() : undefined
			)
			.then(() => {
				this.scheduleNextPoll(token);
			});
	}

	private hasUnsentChange(): boolean {
		return this.writer.hasUnsentChange || this.specialWritesInFlight > 0;
	}

	/** Reads the energy at most once per interval, never while a change is pending; a failure keeps the previous value. Never rejects. */
	private async readEnergyIfDue(): Promise<void> {
		const { driver, generation } = this;
		if (
			driver === undefined ||
			this.isUnreachable ||
			this.lastState === undefined ||
			this.hasUnsentChange() ||
			this.options.now() < this.nextEnergyReadAt
		) {
			return;
		}
		try {
			const energy = await driver.readEnergy();
			if (generation !== this.generation) {
				return;
			}
			this.energy = energy;
			this.nextEnergyReadAt =
				this.options.now() + this.options.energyIntervalMilliseconds;
			this.notify();
		} catch (error) {
			if (generation !== this.generation) {
				return;
			}
			this.options.onError(error);
			this.nextEnergyReadAt =
				this.options.now() + this.options.energyRetryMilliseconds;
		}
	}

	private scheduleNextPoll(token: symbol): void {
		if (this.pollToken !== token) {
			return;
		}
		this.cancelPoll = this.options.schedule(() => {
			this.runPoll(token);
		}, this.pollIntervalMilliseconds);
	}

	private notify(): void {
		const view = this.view;
		for (const listener of this.listeners) {
			try {
				listener(view);
			} catch (error) {
				this.options.onError(error);
			}
		}
	}
}
