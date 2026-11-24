/** Why a source was cut off: its level rose, its port changed, it vanished, its loopback was relinked or too loud, or a level change failed. */
export const ListenCutReason = {
	levelRaised: 'level-raised',
	portChanged: 'port-changed',
	sourceGone: 'source-gone',
	loopbackRelinked: 'loopback-relinked',
	streamTooLoud: 'stream-too-loud',
	streamMissing: 'stream-missing',
	levelChangeFailed: 'level-change-failed',
} as const;

export type ListenCutReason =
	(typeof ListenCutReason)[keyof typeof ListenCutReason];
