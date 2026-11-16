import { NowPlayingMetrics } from '../actions/now_playing_metrics';

const BACKDROP_IMAGE = new RegExp(
	`<image (?=[^>]*width="${NowPlayingMetrics.stripWidth}")`,
	'g'
);

/**
 * Marks the backdrop images (as wide as the whole strip) to be scaled by nearest neighbour.
 * Smooth scaling to 800 px costs about 15 ms per frame in WebAssembly, and the dimmed backdrop hides the 3 px blocks of a 256 px cover.
 */
export function scaleBackdropFast(svg: string): string {
	return svg.replace(BACKDROP_IMAGE, '<image image-rendering="optimizeSpeed" ');
}
