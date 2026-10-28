import type { CoverLoader } from './cover_loader';
import type { DialPresence } from './dial_presence';
import type { PlaylistCatalog } from './playlist_catalog';

/** What the carousel renderer reads: the playlists, the covers, whether the playing track is in the playlist, the playing track's cover for the backdrop, and who to tell when covers arrive. */
export type PlaylistsCarouselRendererOptions = Readonly<{
	catalog: Pick<PlaylistCatalog, 'playlists' | 'hasContent'>;
	covers: Pick<CoverLoader, 'get' | 'fetch' | 'retryFailed'>;
	presence: Pick<DialPresence, 'contains'>;
	readBackdropCover: () => string | undefined;
	onCoversLoaded: () => void;
}>;
