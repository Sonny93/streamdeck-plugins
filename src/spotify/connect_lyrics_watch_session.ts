import { CdpClient } from '../cdp/cdp_client';
import { SpotifyLyricsBinding } from './spotify_lyrics_binding';
import { fetchSpotifyPageTarget } from './fetch_spotify_page_target';
import type { LyricsWatchCallbacks } from './lyrics_watch_callbacks';
import { injectLyricsWatchScript } from './inject_lyrics_watch_script';
import { parseLyricsBindingPayload } from './parse_lyrics_binding_payload';
import { parseDefaultExecutionContextId } from './parse_default_execution_context_id';

function handleBindingCalled(
	params: unknown,
	callbacks: LyricsWatchCallbacks
): void {
	try {
		const isAvailable = parseLyricsBindingPayload(params);
		if (isAvailable !== undefined) {
			callbacks.onChange(isAvailable);
		}
	} catch (error) {
		callbacks.onError(error);
	}
}

function handleContextCreated(
	client: CdpClient,
	params: unknown,
	callbacks: LyricsWatchCallbacks
): void {
	const contextId = parseDefaultExecutionContextId(params);
	if (contextId === undefined) {
		return;
	}
	injectLyricsWatchScript(client, contextId).catch(callbacks.onError);
}

/**
 * Attaches to the already running Spotify UI page and starts reporting lyrics availability.
 * Never launches Spotify: it rejects when the DevTools port or the page is missing.
 * A page reload creates a new execution context, in which the script is injected again.
 */
export async function connectLyricsWatchSession(
	callbacks: LyricsWatchCallbacks,
	onClosed: () => void
): Promise<CdpClient> {
	const pageTarget = await fetchSpotifyPageTarget();
	const client = await CdpClient.connect(pageTarget.webSocketDebuggerUrl);
	try {
		client.onClose(onClosed);
		client.on('Runtime.bindingCalled', (params) =>
			handleBindingCalled(params, callbacks)
		);
		client.on('Runtime.executionContextCreated', (params) =>
			handleContextCreated(client, params, callbacks)
		);
		await client.send('Runtime.addBinding', {
			name: SpotifyLyricsBinding.name,
		});
		await client.send('Runtime.enable');
		await injectLyricsWatchScript(client);
		return client;
	} catch (error) {
		client.close();
		throw error;
	}
}
