type PropertyInspectorRepliesOptions<TPayload> = Readonly<{
	readCurrentActionId: () => string | undefined;
	sendToCurrent: (payload: TPayload) => Promise<void>;
}>;

type PropertyInspectorReply<TPayload> = Readonly<{
	actionId: string;
	event: string;
	payload: TPayload;
}>;

/**
 * Delivers the answers to the property inspector datasource requests (sdpi-components `datasource` protocol).
 * The Stream Deck SDK only delivers a message to the inspector of the action selected last, but OpenDeck loads
 * the inspector of every action at startup and only announces the one the user selects: an answer given
 * meanwhile would be lost. It keeps the latest answer of each action and event, sends it right away when the
 * inspector of that action is the current one, and otherwise when that inspector appears.
 */
export class PropertyInspectorReplies<TPayload> {
	private readonly latest = new Map<string, Map<string, TPayload>>();

	constructor(
		private readonly options: PropertyInspectorRepliesOptions<TPayload>
	) {}

	/** Keeps the answer, replacing the previous one of the same action and event, and sends it when its inspector is the current one. */
	async reply(reply: PropertyInspectorReply<TPayload>): Promise<void> {
		const payloads =
			this.latest.get(reply.actionId) ?? new Map<string, TPayload>();
		payloads.set(reply.event, reply.payload);
		this.latest.set(reply.actionId, payloads);
		if (this.options.readCurrentActionId() !== reply.actionId) {
			return;
		}
		await this.options.sendToCurrent(reply.payload);
	}

	/** Sends the kept answers of an action, to call when its inspector appears. */
	async deliverPending(actionId: string): Promise<void> {
		const payloads = this.latest.get(actionId);
		if (payloads === undefined) {
			return;
		}
		await Promise.all(
			[...payloads.values()].map((payload) =>
				this.options.sendToCurrent(payload)
			)
		);
	}

	/** Drops the kept answers of an action, to call when the action disappears. */
	forget(actionId: string): void {
		this.latest.delete(actionId);
	}
}
