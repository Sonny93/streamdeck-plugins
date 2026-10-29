import type { Scheduler } from 'deck-kit/async/scheduler';

import type { SpotifyLyricsLine } from '../spotify/spotify_lyrics_line';
import type { InactivityMonitor } from './inactivity_monitor';
import type { PlayerStateHub } from './player_state_hub';

/**
 * What the "now playing" screen reads: the inactivity of the Stream Deck, the player state, how to download a cover,
 * how to fetch the synced lyrics of the loaded item (by URI), the clock and scheduler of the progress bar and the lyrics, and who to tell about failures.
 */
export type NowPlayingScreenOptions = Readonly<{
	inactivity: Pick<
		InactivityMonitor,
		'isInactive' | 'subscribe' | 'recordActivity'
	>;
	playerStateHub: Pick<PlayerStateHub, 'current' | 'subscribe'>;
	fetchCover: (url: string) => Promise<string>;
	fetchLyrics: (trackUri: string) => Promise<readonly SpotifyLyricsLine[]>;
	schedule: Scheduler;
	now: () => number;
	onError: (error: unknown) => void;
}>;
