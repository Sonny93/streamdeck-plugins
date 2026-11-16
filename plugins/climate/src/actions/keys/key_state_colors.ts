import { KeyPalette } from './key_palette';
import { KeyState } from './key_state';
import type { KeyStateValue } from './key_state_value';

/** Color of the icon and the label of a key in each state: mint while on, grey while off, dark while unavailable. */
export const KeyStateColors: Readonly<Record<KeyStateValue, string>> = {
	[KeyState.off]: KeyPalette.idle,
	[KeyState.on]: KeyPalette.active,
	[KeyState.unavailable]: KeyPalette.unavailable,
};
