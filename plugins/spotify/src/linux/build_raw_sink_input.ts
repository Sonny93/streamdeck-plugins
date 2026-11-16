type RawSinkInputOptions = Readonly<{
	index?: number;
	binary?: string;
	applicationName?: string;
	nodeName?: string;
	clientId?: number;
	processId?: number;
	volumePercents?: readonly number[];
	isMuted?: boolean;
}>;

const CHANNEL_NAMES = ['front-left', 'front-right'] as const;
const FULL_VOLUME_VALUE = 65_536;
const PERCENT = 100;

/** Test helper: builds one entry of `pactl -f json list sink-inputs`, with the shape of the real capture. */
export function buildRawSinkInput(options: RawSinkInputOptions = {}): unknown {
	const volumePercents = options.volumePercents ?? [PERCENT, PERCENT];
	return {
		index: options.index ?? 1,
		client: String(options.clientId ?? 0),
		mute: options.isMuted ?? false,
		volume: Object.fromEntries(
			volumePercents.map((percent, position) => [
				CHANNEL_NAMES[position] ?? `aux${position}`,
				{
					value: Math.round((FULL_VOLUME_VALUE * percent) / PERCENT),
					value_percent: `${percent}%`,
				},
			])
		),
		properties: {
			...(options.applicationName === undefined
				? {}
				: { 'application.name': options.applicationName }),
			...(options.processId === undefined
				? {}
				: { 'application.process.id': String(options.processId) }),
			...(options.nodeName === undefined
				? {}
				: { 'node.name': options.nodeName }),
			...(options.binary === undefined
				? {}
				: { 'application.process.binary': options.binary }),
		},
	};
}
