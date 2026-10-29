/** Wraps an async loader so it runs once and shares its result; a failed load is forgotten so the next call tries again. */
export function onceAsync<TValue>(
	load: () => Promise<TValue>
): () => Promise<TValue> {
	let cached: Promise<TValue> | undefined;
	return () => {
		cached ??= load().catch((error: unknown) => {
			cached = undefined;
			throw error;
		});
		return cached;
	};
}
