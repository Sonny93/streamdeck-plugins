/**
 * Geometry and style of the "now playing" screen, in pixels of the whole touch strip (four 200 px dial segments side by side).
 * Each dial draws the 200 px slice of its column.
 */
export const NowPlayingMetrics = {
	stripWidth: 800,
	stripHeight: 100,
	segmentWidth: 200,
	background: '#000000',
	backdropOpacity: 0.35,
	fontFamily: 'Arial, Helvetica, sans-serif',
	cover: {
		x: 8,
		y: 8,
		size: 84,
		cornerRadius: 8,
		fallbackColor: '#282828',
	},
	pauseBadge: {
		radius: 18,
		backdropColor: '#000000',
		backdropOpacity: 0.6,
		barWidth: 5,
		barHeight: 16,
		barGap: 5,
		color: '#FFFFFF',
	},
	textX: 108,
	title: {
		y: 36,
		fontSize: 26,
		fontWeight: 700,
		color: '#FFFFFF',
		maxLength: 44,
	},
	artists: {
		y: 61,
		fontSize: 18,
		color: '#D9D9D9',
		maxLength: 64,
		separator: ', ',
	},
	time: {
		elapsedRight: 152,
		totalLeft: 744,
		y: 89,
		fontSize: 14,
		fontWeight: 700,
		color: '#D9D9D9',
	},
	progress: {
		x: 160,
		y: 82,
		width: 576,
		height: 6,
		trackColor: '#FFFFFF',
		trackOpacity: 0.25,
		playingColor: '#1DB954',
		pausedColor: '#B3B3B3',
	},
} as const;
