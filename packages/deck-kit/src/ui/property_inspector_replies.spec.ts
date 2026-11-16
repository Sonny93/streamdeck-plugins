import { describe, expect, it, vi } from 'vitest';

import { PropertyInspectorReplies } from './property_inspector_replies';

function buildReplies(currentActionId: string | undefined) {
	const sendToCurrent = vi.fn<(payload: string) => Promise<void>>(() =>
		Promise.resolve()
	);
	const replies = new PropertyInspectorReplies<string>({
		readCurrentActionId: () => currentActionId,
		sendToCurrent,
	});
	return { replies, sendToCurrent };
}

describe('PropertyInspectorReplies', () => {
	it('should send the reply at once when the inspector of its action is the current one', async () => {
		const { replies, sendToCurrent } = buildReplies('action-a');

		await replies.reply({
			actionId: 'action-a',
			event: 'list',
			payload: 'one',
		});

		expect(sendToCurrent).toHaveBeenCalledExactlyOnceWith('one');
	});

	it('should hold the reply until the inspector appears when another inspector is the current one', async () => {
		const { replies, sendToCurrent } = buildReplies('action-b');

		await replies.reply({
			actionId: 'action-a',
			event: 'list',
			payload: 'one',
		});
		expect(sendToCurrent).not.toHaveBeenCalled();

		await replies.deliverPending('action-a');
		expect(sendToCurrent).toHaveBeenCalledExactlyOnceWith('one');
	});

	it('should hold the reply when no inspector is the current one', async () => {
		const { replies, sendToCurrent } = buildReplies(undefined);

		await replies.reply({
			actionId: 'action-a',
			event: 'list',
			payload: 'one',
		});

		expect(sendToCurrent).not.toHaveBeenCalled();
	});

	it('should deliver only the latest reply of an action and event', async () => {
		const { replies, sendToCurrent } = buildReplies(undefined);

		await replies.reply({
			actionId: 'action-a',
			event: 'list',
			payload: 'old',
		});
		await replies.reply({
			actionId: 'action-a',
			event: 'list',
			payload: 'new',
		});
		await replies.deliverPending('action-a');

		expect(sendToCurrent).toHaveBeenCalledExactlyOnceWith('new');
	});

	it('should deliver one reply per event of an action', async () => {
		const { replies, sendToCurrent } = buildReplies(undefined);

		await replies.reply({
			actionId: 'action-a',
			event: 'outputs',
			payload: 'o',
		});
		await replies.reply({
			actionId: 'action-a',
			event: 'inputs',
			payload: 'i',
		});
		await replies.deliverPending('action-a');

		expect(sendToCurrent.mock.calls.flat().toSorted()).toEqual(['i', 'o']);
	});

	it('should not deliver the replies of another action', async () => {
		const { replies, sendToCurrent } = buildReplies(undefined);

		await replies.reply({
			actionId: 'action-a',
			event: 'list',
			payload: 'one',
		});
		await replies.deliverPending('action-b');

		expect(sendToCurrent).not.toHaveBeenCalled();
	});

	it('should deliver nothing once the action is forgotten', async () => {
		const { replies, sendToCurrent } = buildReplies(undefined);

		await replies.reply({
			actionId: 'action-a',
			event: 'list',
			payload: 'one',
		});
		replies.forget('action-a');
		await replies.deliverPending('action-a');

		expect(sendToCurrent).not.toHaveBeenCalled();
	});
});
