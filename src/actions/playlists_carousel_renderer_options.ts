import type { CoverLoader } from './cover_loader';
import type { PlaylistCatalog } from './playlist_catalog';
import type { LikeTargetStore } from './like_target_store';

/** What the carousel renderer reads: the playlists, the covers, the like target, and who to tell when covers arrive. */
export type PlaylistsCarouselRendererOptions = Readonly<{
	catalog: Pick<PlaylistCatalog, 'playlists' | 'hasContent'>;
	covers: Pick<CoverLoader, 'get' | 'fetch' | 'retryFailed'>;
	likeTargetStore: Pick<LikeTargetStore, 'current'>;
	onCoversLoaded: () => void;
}>;
