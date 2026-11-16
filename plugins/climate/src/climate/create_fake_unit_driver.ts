import type { UnitDriver } from '../daikin/unit_driver';
import type {
	DesiredUnitState,
	UnitEnergy,
	UnitSnapshot,
	UnitState,
	WritableSpecialMode,
} from '../daikin/unit_types';

type Deferred<TValue> = {
	readonly promise: Promise<TValue>;
	readonly resolve: (value: TValue) => void;
	readonly reject: (error: unknown) => void;
};

function createDeferred<TValue>(): Deferred<TValue> {
	let settleWithValue: (value: TValue) => void = () => undefined;
	let settleWithError: (error: unknown) => void = () => undefined;
	const promise = new Promise<TValue>((resolve, reject) => {
		settleWithValue = resolve;
		settleWithError = reject;
	});
	return { promise, resolve: settleWithValue, reject: settleWithError };
}

export type FakeUnitDriver = Readonly<{
	driver: UnitDriver;
	/** Number of snapshot reads started. */
	readCount: () => number;
	/** Patches of the writes started, in order. */
	writtenPatches: () => readonly DesiredUnitState[];
	/** Answers the oldest read still waiting. */
	answerRead: (snapshot: UnitSnapshot) => void;
	failRead: (error: unknown) => void;
	/** Answers the oldest write still waiting. */
	answerWrite: (state: UnitState) => void;
	failWrite: (error: unknown) => void;
	/** Number of energy reads started. */
	energyReadCount: () => number;
	answerEnergy: (energy: UnitEnergy) => void;
	failEnergy: (error: unknown) => void;
	/** Special mode writes started, in order. */
	specialWrites: () => readonly Readonly<{
		mode: WritableSpecialMode;
		isActive: boolean;
	}>[];
	answerSpecialWrite: (state: UnitState) => void;
	failSpecialWrite: (error: unknown) => void;
}>;

/** A driver whose reads and writes wait until the test answers them, to hold them in flight. */
export function createFakeUnitDriver(): FakeUnitDriver {
	const reads: Deferred<UnitSnapshot>[] = [];
	const writes: Deferred<UnitState>[] = [];
	const patches: DesiredUnitState[] = [];
	const energies: Deferred<UnitEnergy>[] = [];
	const specials: Deferred<UnitState>[] = [];
	const specialRequests: { mode: WritableSpecialMode; isActive: boolean }[] =
		[];
	let energiesAnswered = 0;
	let specialsAnswered = 0;
	let readsStarted = 0;
	let readsAnswered = 0;
	let writesAnswered = 0;

	const driver: UnitDriver = {
		hints: { minimumPollIntervalMs: 0 },
		readSnapshot: () => {
			readsStarted += 1;
			const read = createDeferred<UnitSnapshot>();
			reads.push(read);
			return read.promise;
		},
		writeState: (desired) => {
			patches.push(desired);
			const write = createDeferred<UnitState>();
			writes.push(write);
			return write.promise;
		},
		writeSpecialMode: (mode, isActive) => {
			specialRequests.push({ mode, isActive });
			const special = createDeferred<UnitState>();
			specials.push(special);
			return special.promise;
		},
		readEnergy: () => {
			const energy = createDeferred<UnitEnergy>();
			energies.push(energy);
			return energy.promise;
		},
		readCapabilities: () => Promise.reject(new Error('Not used in tests')),
		readIdentity: () => Promise.reject(new Error('Not used in tests')),
	};

	function takeRead(): Deferred<UnitSnapshot> {
		const read = reads[readsAnswered];
		readsAnswered += 1;
		if (read === undefined) {
			throw new Error('No read is waiting');
		}
		return read;
	}

	function takeWrite(): Deferred<UnitState> {
		const write = writes[writesAnswered];
		writesAnswered += 1;
		if (write === undefined) {
			throw new Error('No write is waiting');
		}
		return write;
	}

	function takeEnergy(): Deferred<UnitEnergy> {
		const energy = energies[energiesAnswered];
		energiesAnswered += 1;
		if (energy === undefined) {
			throw new Error('No energy read is waiting');
		}
		return energy;
	}

	function takeSpecial(): Deferred<UnitState> {
		const special = specials[specialsAnswered];
		specialsAnswered += 1;
		if (special === undefined) {
			throw new Error('No special mode write is waiting');
		}
		return special;
	}

	return {
		driver,
		energyReadCount: () => energies.length,
		answerEnergy: (energy) => {
			takeEnergy().resolve(energy);
		},
		failEnergy: (error) => {
			takeEnergy().reject(error);
		},
		specialWrites: () => specialRequests,
		answerSpecialWrite: (state) => {
			takeSpecial().resolve(state);
		},
		failSpecialWrite: (error) => {
			takeSpecial().reject(error);
		},
		readCount: () => readsStarted,
		writtenPatches: () => patches,
		answerRead: (snapshot) => {
			takeRead().resolve(snapshot);
		},
		failRead: (error) => {
			takeRead().reject(error);
		},
		answerWrite: (state) => {
			takeWrite().resolve(state);
		},
		failWrite: (error) => {
			takeWrite().reject(error);
		},
	};
}
