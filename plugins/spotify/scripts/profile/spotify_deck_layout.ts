import type { ProfileLayout } from './profile_layout.ts';
import type { ControlPlacement } from './control_placement.ts';

type DialActionIds = readonly [string, string, string, string];

/** The four dials: playlists, then the volume of Spotify, of the app in the foreground and of an app to pick. */
function buildDials(actionIds: DialActionIds): ControlPlacement[] {
	const [playlistsId, spotifyId, focusedId, pickedId] = actionIds;
	return [
		{
			column: 0,
			row: 0,
			actionUuid: 'com.sonny93.spotify.playlists',
			actionId: playlistsId,
		},
		{
			column: 1,
			row: 0,
			actionUuid: 'com.sonny93.spotify.volume',
			actionId: spotifyId,
			settings: { target: 'spotify' },
		},
		{
			column: 2,
			row: 0,
			actionUuid: 'com.sonny93.spotify.volume',
			actionId: focusedId,
			settings: { target: 'focused' },
		},
		{
			column: 3,
			row: 0,
			actionUuid: 'com.sonny93.spotify.volume',
			actionId: pickedId,
			settings: { target: 'app' },
		},
	];
}

/**
 * The Spotify Deck profile for the Stream Deck +: previous, play/pause and next on the first row, then a folder holding
 * the like, search, lyrics and full screen keys; the "show Spotify" key below previous; the playlists dial and three
 * volume dials, kept inside the folder too.
 */
export const SpotifyDeckLayout: ProfileLayout = {
	name: 'Spotify Deck',
	profileUuid: '6cf7fff6-1bf9-4d2b-ada7-0f84ca45e3f2',
	defaultPageUuid: 'ba131794-aa36-47e1-8dba-36955e9f9cf2',
	contentPageUuid: '3d6af341-25c7-47e9-971a-03292c83bfe7',
	keys: [
		{
			column: 0,
			row: 0,
			actionUuid: 'com.sonny93.spotify.previous-track',
			actionId: '617e056f-b5a2-436d-b30d-5c050964d046',
		},
		{
			column: 1,
			row: 0,
			actionUuid: 'com.sonny93.spotify.play-pause',
			actionId: '75d2c375-21fe-4014-af1f-1fe14547dffd',
		},
		{
			column: 2,
			row: 0,
			actionUuid: 'com.sonny93.spotify.next-track',
			actionId: '49f3b799-f4ed-42b4-8742-3920277f5d7d',
		},
		{
			column: 0,
			row: 1,
			actionUuid: 'com.sonny93.spotify.show-spotify',
			actionId: '7a9ff5cc-b5cb-4c36-a288-770fbd0129a2',
		},
	],
	encoders: buildDials([
		'ac34f29c-3e70-468b-9298-57aa4aa2f493',
		'b0aab8bf-7cb4-475e-81a2-7cb10e7dc158',
		'e76a5abc-00aa-4f8a-87d3-cde82c20a1cf',
		'feb4751c-b083-4fe0-b7bb-4566ea50515c',
	]),
	folders: [
		{
			column: 3,
			row: 0,
			actionId: '12eb5d7f-cb59-4699-b186-863bc432f8d1',
			pageUuid: '952be81f-c829-40b3-895c-0052397cb1ac',
			backActionId: 'e4e24cbe-e340-4835-82de-a9b4087f3ba9',
			keys: [
				{
					column: 1,
					row: 0,
					actionUuid: 'com.sonny93.spotify.like',
					actionId: '31d0657b-0aaa-43dd-bce4-9952db9d1a41',
				},
				{
					column: 2,
					row: 0,
					actionUuid: 'com.sonny93.spotify.open-search',
					actionId: 'c5ba07b1-37c6-4b38-9ced-76948d0c58b7',
				},
				{
					column: 3,
					row: 0,
					actionUuid: 'com.sonny93.spotify.toggle-lyrics',
					actionId: '798d97b6-d93a-496f-8c66-b5880337c067',
				},
				{
					column: 0,
					row: 1,
					actionUuid: 'com.sonny93.spotify.toggle-fullscreen',
					actionId: '05c07448-a08f-44d0-afe2-a219a5a24501',
				},
			],
			encoders: buildDials([
				'd6cddc30-0486-457a-83ea-ed60101ac8fb',
				'4310d9b2-156c-43d1-9b25-0c7f4ae705b4',
				'758db547-f104-4fef-bb20-d3548857f35b',
				'1e606fd1-5a21-499c-9830-39ea6e7a0cc6',
			]),
		},
	],
};
