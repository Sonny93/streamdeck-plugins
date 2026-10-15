import { SpotifyServices } from './spotify_services';
import { SpotifyPlayerBinding } from './spotify_player_binding';

const PREFERRED_IMAGE_LABELS = ['small', 'standard'];

/**
 * Builds the body, for `buildPlatformExpression`, of the idempotent script that reports the player state through the CDP binding.
 * It reports the current state immediately, then re-reads it on every player `update` event and reports only changes.
 * The state carries the loaded track's title, artists, cover reference (label small, then standard, then the first image) and playback position.
 * Injecting it again replaces the previous listener, even one left by an older version of the script, and re-sends the current state.
 */
export function buildPlayerWatchBody(): string {
	return `
		const bindingName = ${JSON.stringify(SpotifyPlayerBinding.name)};
		const watcherProperty = ${JSON.stringify(SpotifyPlayerBinding.guardProperty)};
		const preferredImageLabels = ${JSON.stringify(PREFERRED_IMAGE_LABELS)};
		const player = resolve(${JSON.stringify(SpotifyServices.player)});
		const state = window[watcherProperty] ?? (window[watcherProperty] = { lastPayload: undefined, unsubscribe: undefined });
		const pickImageUrl = (item) => {
			const images = item.images ?? item.album?.images ?? [];
			const image = preferredImageLabels.map((label) => images.find((candidate) => candidate.label === label)).find((candidate) => candidate !== undefined) ?? images[0];
			return image?.url ?? null;
		};
		const describeTrack = (playerState) => {
			const item = playerState.item;
			if (!item) { return null; }
			return {
				title: item.name ?? '',
				artistNames: (item.artists ?? []).map((artist) => artist.name).filter((name) => typeof name === 'string'),
				imageUrl: pickImageUrl(item),
				durationMilliseconds: playerState.duration ?? item.duration?.milliseconds ?? 0,
				positionMilliseconds: playerState.positionAsOfTimestamp ?? 0,
				positionTimestamp: playerState.timestamp ?? Date.now(),
				playbackSpeed: playerState.speed ?? 1,
			};
		};
		const report = async (force) => {
			const playerState = await player.getState();
			const payload = JSON.stringify({
				isPaused: playerState.isPaused,
				trackUri: playerState.item?.uri ?? null,
				track: describeTrack(playerState),
			});
			const binding = window[bindingName];
			if (typeof binding !== 'function') { return; }
			if (!force && payload === state.lastPayload) { return; }
			state.lastPayload = payload;
			binding(payload);
		};
		if (typeof state.unsubscribe === 'function') { state.unsubscribe(); }
		state.unsubscribe = player.getEvents().addListener('update', () => { void report(false); });
		await report(true);
	`;
}
