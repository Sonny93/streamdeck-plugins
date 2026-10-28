import { SpotifyTestIds } from './spotify_test_ids';
import { SpotifyCloseModalOutcome } from './spotify_close_modal_outcome';

const ESCAPE_KEY_CODE = 27;

/**
 * Builds the expression that closes the search modal with a synthetic Escape keydown on its dialog.
 * A synthetic event closes the modal without triggering the browser's own full screen exit, unlike a trusted Escape.
 */
export function buildCloseSearchModalExpression(): string {
	const selector = JSON.stringify(
		`[data-testid="${SpotifyTestIds.searchModalInput}"]`
	);
	return `(() => {
		const input = document.querySelector(${selector});
		const dialog = input ? input.closest('[role="dialog"]') : null;
		if (!dialog) { return ${JSON.stringify(SpotifyCloseModalOutcome.modalNotFound)}; }
		dialog.dispatchEvent(new KeyboardEvent('keydown', {
			key: 'Escape',
			code: 'Escape',
			keyCode: ${ESCAPE_KEY_CODE},
			which: ${ESCAPE_KEY_CODE},
			bubbles: true,
			cancelable: true,
		}));
		return ${JSON.stringify(SpotifyCloseModalOutcome.closed)};
	})()`;
}
