import type { LikeTargetRef } from '../spotify/like_target_ref';
import type { PlayerStateHub } from './player_state_hub';

/** What `DialPresence` needs: the player state, the presence query, and who to tell when a dial's answer changes. */
export type DialPresenceOptions = Readonly<{
	playerStateHub: Pick<PlayerStateHub, 'current'>;
	query: (
		options: Readonly<{ trackUri: string; target: LikeTargetRef }>
	) => Promise<boolean>;
	onChange: (dialId: string) => void;
}>;
