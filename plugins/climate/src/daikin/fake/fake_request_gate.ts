export type FakeRequestFailure = 'hang' | 'drop';

type PlannedFailure = {
	readonly path: string;
	readonly failure: FakeRequestFailure;
	readonly remainingSkips: number;
};

export type FakeRequestGate = {
	readonly setReachable: (isReachable: boolean) => void;
	readonly isReachable: () => boolean;
	readonly planFailure: (
		path: string,
		failure: FakeRequestFailure,
		skipCount: number
	) => void;
	readonly takeFailure: (path: string) => FakeRequestFailure | null;
};

export function createFakeRequestGate(): FakeRequestGate {
	let isReachable = true;
	let plannedFailures: readonly PlannedFailure[] = [];

	return {
		setReachable: (value) => {
			isReachable = value;
		},
		isReachable: () => isReachable,
		planFailure: (path, failure, skipCount) => {
			plannedFailures = [
				...plannedFailures,
				{ path, failure, remainingSkips: skipCount },
			];
		},
		takeFailure: (path) => {
			const matching = plannedFailures.find((planned) => planned.path === path);
			if (matching === undefined) return null;
			if (matching.remainingSkips > 0) {
				plannedFailures = plannedFailures.map((planned) =>
					planned === matching
						? { ...planned, remainingSkips: planned.remainingSkips - 1 }
						: planned
				);
				return null;
			}
			plannedFailures = plannedFailures.filter(
				(planned) => planned !== matching
			);
			return matching.failure;
		},
	};
}
