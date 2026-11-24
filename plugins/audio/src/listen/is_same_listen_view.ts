import type { ListenView } from './listen_view';

function isSameSources(
	first: ListenView['sources'],
	second: ListenView['sources']
): boolean {
	return (
		first.length === second.length &&
		first.every((source, index) => {
			const other = second[index];
			return (
				other !== undefined &&
				source.id === other.id &&
				source.name === other.name &&
				source.loudestLevel === other.loudestLevel &&
				source.isMuted === other.isMuted &&
				source.activePort === other.activePort
			);
		})
	);
}

export function isSameListenView(
	first: ListenView | undefined,
	second: ListenView | undefined
): boolean {
	if (first === undefined || second === undefined) {
		return first === second;
	}
	return (
		first.listenedSourceIds.size === second.listenedSourceIds.size &&
		[...first.listenedSourceIds].every((id) =>
			second.listenedSourceIds.has(id)
		) &&
		isSameSources(first.sources, second.sources)
	);
}
