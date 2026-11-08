import type { JsonRecord } from './profile_document.ts';

/** Builds a page manifest with the given keys and dials, keyed by position, for tests. */
export function buildTestPage(
	options: Readonly<{ keys?: JsonRecord; dials?: JsonRecord }>
): JsonRecord {
	const toActions = (actions: JsonRecord | undefined): JsonRecord | null =>
		actions === undefined || Object.keys(actions).length === 0 ? null : actions;
	return {
		Controllers: [
			{ Actions: toActions(options.keys), Type: 'Keypad' },
			{ Actions: toActions(options.dials), Type: 'Encoder' },
		],
		Icon: '',
		Name: '',
	};
}
