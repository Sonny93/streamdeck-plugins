import type { KeyAppearance } from './key_appearance';
import { KeyPalette } from './key_palette';
import { KeyState } from './key_state';
import type { KeyStateValue } from './key_state_value';

const COLORS: Readonly<Record<KeyStateValue, string>> = {
	[KeyState.off]: KeyPalette.idle,
	[KeyState.on]: KeyPalette.active,
	[KeyState.unavailable]: KeyPalette.unavailable,
};

/** Look of a key that shows something on or off with one icon: blue while on, grey while off, dark while unavailable. */
export function toggleKeyAppearance(
	glyph: (color: string) => string,
	state: KeyStateValue
): KeyAppearance {
	return { glyph, color: COLORS[state] };
}
