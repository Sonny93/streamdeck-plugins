import { CdpClient } from '../cdp/cdp_client';
import { SpotifyLaunchTiming } from './spotify_launch_timing';
import { SpotifyPlayerBinding } from './spotify_player_binding';
import { retryDuringColdStart } from './retry_during_cold_start';
import { fetchSpotifyPageTarget } from './fetch_spotify_page_target';
import { injectPlayerWatchScript } from './inject_player_watch_script';
import { parsePlayerBindingPayload } from './parse_player_binding_payload';
import { SpotifyLaunchTimeoutError } from './spotify_launch_timeout_error';
import type { PlayerStateWatchCallbacks } from './player_state_watch_callbacks';
import { SpotifyPlatformNotFoundError } from './spotify_platform_not_found_error';
import { parseDefaultExecutionContextId } from './parse_default_execution_context_id';

type InjectionOptions = Readonly<{
	client: CdpClient;
	waitedFor: string;
	contextId?: number;
}>;

function injectWhenPlatformIsReady(options: InjectionOptions): Promise<void> {
	return retryDuringColdStart({
		attempt: () => injectPlayerWatchScript(options.client, options.contextId),
		isRetryable: (error) => error instanceof SpotifyPlatformNotFoundError,
		isColdStart: true,
		createTimeoutError: (lastError) =>
			new SpotifyLaunchTimeoutError({
				waitedFor: options.waitedFor,
				timeoutMilliseconds: SpotifyLaunchTiming.timeoutMilliseconds,
				cause: lastError,
			}),
	});
}

function handleBindingCalled(
	params: unknown,
	callbacks: PlayerStateWatchCallbacks
): void {
	try {
		const state = parsePlayerBindingPayload(params);
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
	callbacks: PlayerStateWatchCallbacks
): void {
	const contextId = parseDefaultExecutionContextId(params);
	if (contextId === undefined) {
		return;
	}
	injectWhenPlatformIsReady({
		client,
		contextId,
		waitedFor: 'the Spotify platform after a reload',
	}).catch(callbacks.onError);
}

/**
 * Attaches to the already running Spotify UI page and starts reporting the player state.
 * Never launches Spotify: it rejects when the DevTools port or the page is missing.
 * A page reload creates a new execution context, in which the script is injected again once the platform is back.
 */
export async function connectPlayerWatchSession(
	callbacks: PlayerStateWatchCallbacks,
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
			name: SpotifyPlayerBinding.name,
		});
		await client.send('Runtime.enable');
		await injectWhenPlatformIsReady({
			client,
			waitedFor: 'the Spotify platform',
		});
		return client;
	} catch (error) {
		client.close();
		throw error;
	}
}
