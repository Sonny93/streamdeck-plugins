import type { DialBackdrop } from './dial_backdrop';
import { NowPlayingMetrics } from './now_playing_metrics';
import { buildBackdropImage } from './build_backdrop_image';

/**
 * Draws, in a dial's own 200x100 document, the slice of its column of the playing track's cover stretched over the whole strip and dimmed,
 * so that the dials side by side show one picture; draws nothing without backdrop.
 */
export function buildDialBackdrop(backdrop: DialBackdrop | undefined): string {
	if (backdrop === undefined) {
		return '';
	}
	const { segmentWidth, dialBackdropOpacity } = NowPlayingMetrics;
	return buildBackdropImage({
		coverDataUrl: backdrop.coverDataUrl,
		left: -backdrop.column * segmentWidth,
		opacity: dialBackdropOpacity,
	});
}
