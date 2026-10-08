import type { ProfileLayout } from './profile_layout.ts';

/** The Spotify Deck profile for the Stream Deck +: transport and like keys on the first row, Spotify window keys on the second, and the playlists dial. */
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
			column: 3,
			row: 0,
			actionUuid: 'com.sonny93.spotify.like',
			actionId: '31d0657b-0aaa-43dd-bce4-9952db9d1a41',
		},
		{
			column: 0,
			row: 1,
			actionUuid: 'com.sonny93.spotify.open-search',
			actionId: 'c5ba07b1-37c6-4b38-9ced-76948d0c58b7',
		},
		{
			column: 1,
			row: 1,
			actionUuid: 'com.sonny93.spotify.toggle-lyrics',
			actionId: '798d97b6-d93a-496f-8c66-b5880337c067',
		},
		{
			column: 2,
			row: 1,
			actionUuid: 'com.sonny93.spotify.toggle-fullscreen',
			actionId: '05c07448-a08f-44d0-afe2-a219a5a24501',
		},
	],
	encoders: [
		{
			column: 0,
			row: 0,
			actionUuid: 'com.sonny93.spotify.playlists',
			actionId: 'ac34f29c-3e70-468b-9298-57aa4aa2f493',
		},
	],
};
