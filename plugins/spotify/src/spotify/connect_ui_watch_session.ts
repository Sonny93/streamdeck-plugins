import { CdpClient } from '../cdp/cdp_client';
import { SpotifyUiBinding } from './spotify_ui_binding';
import { injectUiWatchScript } from './inject_ui_watch_script';
import { parseUiBindingPayload } from './parse_ui_binding_payload';
import { fetchSpotifyPageTarget } from './fetch_spotify_page_target';
import type { UiStateWatchCallbacks } from './ui_state_watch_callbacks';
import { parseDefaultExecutionContextId } from './parse_default_execution_context_id';

function handleBindingCalled(
	params: unknown,
	callbacks: UiStateWatchCallbacks
): void {
	try {
		const state = parseUiBindingPayload(params);
		if (state !== undefined) {
			callbacks.onChange(state);
		}
	} catch (error) {
		callbacks.onError(error);
	}
}

function handleContextCreated(
	client: CdpClient,
	params: unknown,
	callbacks: UiStateWatchCallbacks
): void {
	const contextId = parseDefaultExecutionContextId(params);
	if (contextId === undefined) {
		return;
	}
	injectUiWatchScript(client, contextId).catch(callbacks.onError);
}

/**
 * Attaches to the already running Spotify UI page and starts reporting the state of its window.
 * Never launches Spotify: it rejects when the DevTools port or the page is missing.
 * A page reload creates a new execution context, in which the script is injected again.
 */
export async function connectUiWatchSession(
	callbacks: UiStateWatchCallbacks,
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
		await client.send('Runtime.addBinding', { name: SpotifyUiBinding.name });
		await client.send('Runtime.enable');
		await injectUiWatchScript(client);
		return client;
	} catch (error) {
		client.close();
		throw error;
	}
}
