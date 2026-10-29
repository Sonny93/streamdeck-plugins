import type { SpotifyDevice } from '../spotify/spotify_device';

const SHAPES: Readonly<Record<SpotifyDevice['kind'], string>> = {
	computer:
		'<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>',
	phone:
		'<rect x="6.5" y="2.5" width="11" height="19" rx="2.4"/><path d="M10.5 18.2h3"/>',
	tv: '<rect x="2" y="4.5" width="20" height="12.5" rx="1.8"/><path d="M9 21l1.4-4M15 21l-1.4-4M7.5 21h9"/>',
	speaker:
		'<rect x="5.5" y="2.5" width="13" height="19" rx="2.6"/><circle cx="12" cy="14.6" r="3.6"/><circle cx="12" cy="7.2" r="1.3"/>',
};

/** The icon of a Spotify Connect device kind, drawn in a 24×24 box like the images of the manifest. */
export function deviceGlyph(
	kind: SpotifyDevice['kind'],
	color: string
): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${SHAPES[kind]}</g>`;
}
