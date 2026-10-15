/** Geometry and style of a "Volume" dial drawn on its touch strip segment, in strip pixels. */
export const VolumeDialMetrics = {
	stripWidth: 200,
	stripHeight: 100,
	background: '#000000',
	fontFamily: 'Arial, Helvetica, sans-serif',
	left: 12,
	right: 188,
	caption: {
		y: 22,
		fontSize: 10,
		fontWeight: 700,
		color: '#B3B3B3',
	},
	name: {
		y: 46,
		fontSize: 16,
		fontWeight: 700,
		color: '#FFFFFF',
		maxLength: 13,
	},
	level: {
		y: 46,
		fontSize: 16,
		fontWeight: 700,
		color: '#1DB954',
		mutedColor: '#B3B3B3',
	},
	bar: {
		y: 62,
		height: 8,
		trackColor: '#FFFFFF',
		trackOpacity: 0.2,
		color: '#1DB954',
		mutedColor: '#727272',
	},
	note: {
		y: 88,
		fontSize: 10,
		color: '#727272',
	},
} as const;
