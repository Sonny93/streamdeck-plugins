import { describe, expect, it } from 'vitest';

import {
	buildListenSource,
	REAR_MIC_ID,
} from '../../listen/build_listen_source';
import type { ListenView } from '../../listen/listen_view';
import { KeyState } from '../keys/key_state';
import { resolveListenKeyState } from './resolve_listen_key_state';

function buildView(listenedSourceIds: readonly string[]): ListenView {
	return {
		sources: [buildListenSource()],
		listenedSourceIds: new Set(listenedSourceIds),
	};
}

describe('resolveListenKeyState', () => {
	it('should show the key on while its input is listened to', () => {
		expect(resolveListenKeyState(buildView([REAR_MIC_ID]), REAR_MIC_ID)).toBe(
			KeyState.on
		);
	});

	it('should show the key off while its input is not listened to', () => {
		expect(resolveListenKeyState(buildView([]), REAR_MIC_ID)).toBe(
			KeyState.off
		);
	});

	it.each([
		['there is no hub', undefined, REAR_MIC_ID],
		['no input is picked', buildView([]), undefined],
		['the input is unplugged', buildView([]), 'alsa_input.line_in'],
	] as const)('should dim the key when %s', (_case, view, sourceId) => {
		expect(resolveListenKeyState(view, sourceId)).toBe(KeyState.unavailable);
	});
});
