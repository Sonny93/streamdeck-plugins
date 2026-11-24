import type { ListenView } from '../../listen/listen_view';
import { KeyState } from '../keys/key_state';
import type { KeyStateValue } from '../keys/key_state_value';

/** Shows a "Listen toggle" key as on while its input is listened to, and dims it while there is no hub, no input picked, or the input is unplugged. */
export function resolveListenKeyState(
	view: ListenView | undefined,
	sourceId: string | undefined
): KeyStateValue {
	if (
		view === undefined ||
		sourceId === undefined ||
		!view.sources.some((source) => source.id === sourceId)
	) {
		return KeyState.unavailable;
	}
	return view.listenedSourceIds.has(sourceId) ? KeyState.on : KeyState.off;
}
