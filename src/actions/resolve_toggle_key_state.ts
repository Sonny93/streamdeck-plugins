import { ToggleKeyState } from './toggle_key_state';

/** Picks the lit image of a key while what it shows is on, and the plain one otherwise (Spotify unreachable included). */
export function resolveToggleKeyState(isActive: boolean | undefined): number {
	return isActive === true ? ToggleKeyState.active : ToggleKeyState.inactive;
}
