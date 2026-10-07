import { describe, expect, it, vi } from 'vitest';

import { LikePresenceTracker } from './like_presence_tracker';

vi.mock('@elgato/streamdeck', () => ({
	streamDeck: { logger: { debug: vi.fn() } },
}));

const TRACK_A = 'spotify:track:a';
const TRACK_B = 'spotify:track:b';

const target = { uri: undefined, kind: 'liked-songs' } as const;

function buildTracker(query: (trackUri: string) => Promise<boolean>) {
	const onChange = vi.fn();
	const queryMock = vi.fn((options: Readonly<{ trackUri: string }>) =>
		query(options.trackUri)
	);
	return {
		tracker: new LikePresenceTracker({ query: queryMock, onChange }),
		onChange,
		queryMock,
	};
}

describe('LikePresenceTracker', () => {
	it('should report that the track is in the target', async () => {
		const { tracker } = buildTracker(() => Promise.resolve(true));

		await tracker.refresh({ trackUri: TRACK_A, target });

		expect(tracker.isInTarget).toBe(true);
	});

	it('should notify the result of the query', async () => {
		const { tracker, onChange } = buildTracker(() => Promise.resolve(true));

		await tracker.refresh({ trackUri: TRACK_A, target });

		expect(onChange).toHaveBeenLastCalledWith(true);
	});

	it('should not query when there is no track', async () => {
		const { tracker, queryMock } = buildTracker(() => Promise.resolve(true));

		await tracker.refresh({ trackUri: undefined, target });

		expect(queryMock).not.toHaveBeenCalled();
	});

	it('should report not in the target when there is no track', async () => {
		const { tracker } = buildTracker(() => Promise.resolve(true));
		await tracker.refresh({ trackUri: TRACK_A, target });

		await tracker.refresh({ trackUri: undefined, target });

		expect(tracker.isInTarget).toBe(false);
	});

	it('should report not in the target when Spotify is unreachable', async () => {
		const { tracker } = buildTracker(() => Promise.reject(new Error('closed')));

		await tracker.refresh({ trackUri: TRACK_A, target });

		expect(tracker.isInTarget).toBe(false);
	});

	it('should not query again for the same track and target', async () => {
		const { tracker, queryMock } = buildTracker(() => Promise.resolve(true));

		await tracker.refresh({ trackUri: TRACK_A, target });
		await tracker.refresh({ trackUri: TRACK_A, target });

		expect(queryMock).toHaveBeenCalledTimes(1);
	});

	it('should query again when the target changes', async () => {
		const { tracker, queryMock } = buildTracker(() => Promise.resolve(true));

		await tracker.refresh({ trackUri: TRACK_A, target });
		await tracker.refresh({
			trackUri: TRACK_A,
			target: { uri: 'spotify:playlist:p', kind: 'playlist' },
		});

		expect(queryMock).toHaveBeenCalledTimes(2);
	});

	it('should ignore the result of a query superseded by a newer one', async () => {
		const resolvers = new Map<string, (isInTarget: boolean) => void>();
		const { tracker } = buildTracker(
			(trackUri) =>
				new Promise<boolean>((resolve) => {
					resolvers.set(trackUri, resolve);
				})
		);
		const first = tracker.refresh({ trackUri: TRACK_A, target });
		const second = tracker.refresh({ trackUri: TRACK_B, target });

		resolvers.get(TRACK_B)?.(false);
		await second;
		resolvers.get(TRACK_A)?.(true);
		await first;

		expect(tracker.isInTarget).toBe(false);
	});

	it('should report the presence for the target of the last refresh only', async () => {
		const playlist = { uri: 'spotify:playlist:p', kind: 'playlist' } as const;
		const { tracker } = buildTracker(() => Promise.resolve(true));
		await tracker.refresh({ trackUri: TRACK_A, target: playlist });

		expect(tracker.isInTargetFor(playlist)).toBe(true);
		expect(tracker.isInTargetFor(target)).toBe(false);
		expect(
			tracker.isInTargetFor({ uri: 'spotify:playlist:q', kind: 'playlist' })
		).toBe(false);
	});

	it('should not report the presence for a target before any refresh', () => {
		const { tracker } = buildTracker(() => Promise.resolve(true));

		expect(tracker.isInTargetFor(target)).toBe(false);
	});

	it('should report in the target after the track was added', async () => {
		const { tracker } = buildTracker(() => Promise.resolve(false));
		await tracker.refresh({ trackUri: TRACK_A, target });

		tracker.markInTarget();

		expect(tracker.isInTarget).toBe(true);
	});

	it('should ignore a query still running when the track was added', async () => {
		let resolveQuery: (isInTarget: boolean) => void = () => undefined;
		const { tracker } = buildTracker(
			() =>
				new Promise<boolean>((resolve) => {
					resolveQuery = resolve;
				})
		);
		const pending = tracker.refresh({ trackUri: TRACK_A, target });

		tracker.markInTarget();
		resolveQuery(false);
		await pending;

		expect(tracker.isInTarget).toBe(true);
	});
});
