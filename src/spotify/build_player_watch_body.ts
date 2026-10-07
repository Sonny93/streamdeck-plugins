import { SpotifyServices } from './spotify_services';
import { SpotifyPlayerBinding } from './spotify_player_binding';

/**
 * Builds the body, for `buildPlatformExpression`, of the idempotent script that reports the player state through the CDP binding.
 * It reports the current state immediately, then re-reads it on every player `update` event and reports only changes.
 * Injecting it again re-sends the current state without stacking listeners.
 */
export function buildPlayerWatchBody(): string {
	return `
		const bindingName = ${JSON.stringify(SpotifyPlayerBinding.name)};
		const watcherProperty = ${JSON.stringify(SpotifyPlayerBinding.guardProperty)};
		const player = resolve(${JSON.stringify(SpotifyServices.player)});
		const state = window[watcherProperty] ?? (window[watcherProperty] = { lastPayload: undefined, unsubscribe: undefined });
		const report = async (force) => {
			const playerState = await player.getState();
			const payload = JSON.stringify({
				isPaused: playerState.isPaused,
				trackUri: playerState.item?.uri ?? null,
			});
			const binding = window[bindingName];
			if (typeof binding !== 'function') { return; }
			if (!force && payload === state.lastPayload) { return; }
			state.lastPayload = payload;
			binding(payload);
		};
		if (!state.unsubscribe) {
			state.unsubscribe = player.getEvents().addListener('update', () => { void report(false); });
		}
		await report(true);
	`;
}
