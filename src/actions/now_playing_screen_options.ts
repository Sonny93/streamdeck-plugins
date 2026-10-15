import type { PlayerStateHub } from './player_state_hub';
import type { CarouselScheduler } from './carousel_scheduler';
import type { InactivityMonitor } from './inactivity_monitor';

/** What the "now playing" screen reads: the inactivity of the Stream Deck, the player state, how to download a cover, the clock and scheduler of the progress bar, and who to tell about failures. */
export type NowPlayingScreenOptions = Readonly<{
	inactivity: Pick<
		InactivityMonitor,
		'isInactive' | 'subscribe' | 'recordActivity'
	>;
	playerStateHub: Pick<PlayerStateHub, 'current' | 'subscribe'>;
	fetchCover: (url: string) => Promise<string>;
	schedule: CarouselScheduler;
	now: () => number;
	onError: (error: unknown) => void;
}>;
