import type { LikeTargetSettings } from './like_target_settings';

/** The playlist that tracks are added to when the user "likes" the playing track. */
export type LikeTarget = NonNullable<LikeTargetSettings['likeTarget']>;
