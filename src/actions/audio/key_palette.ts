import { AudioKeyState } from './audio_key_state';

/** Colors of the keys of the plugin, shared by the icon and the label of a drawn key. */
export const KeyPalette = {
	background: '#121212',
	byState: {
		[AudioKeyState.off]: '#B3B3B3',
		[AudioKeyState.on]: '#FFB020',
		[AudioKeyState.unavailable]: '#535353',
	},
} as const;
