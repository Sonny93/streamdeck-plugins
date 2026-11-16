import type { AudioApp } from './audio_app';
import type { ForegroundApp } from './foreground_app';
import { isSameImageName } from './is_same_image_name';

function findClosestOwner(
	apps: readonly AudioApp[],
	processId: number
): AudioApp | undefined {
	let closest: AudioApp | undefined;
	let closestDistance = Number.POSITIVE_INFINITY;
	for (const app of apps) {
		const distance = app.processIds?.indexOf(processId) ?? -1;
		if (distance !== -1 && distance < closestDistance) {
			closest = app;
			closestDistance = distance;
		}
	}
	return closest;
}

/**
 * Finds the audio app of the foreground window: first the one with a stream of that very process or, nearest first, of a process it started
 * (browsers and Electron play from a child process), then the one with the same executable name.
 * The process comes first because a program can rename itself and a Wine game runs under a generic executable name.
 */
export function findForegroundApp(
	apps: readonly AudioApp[],
	foreground: ForegroundApp
): AudioApp | undefined {
	const owner =
		foreground.processId === undefined
			? undefined
			: findClosestOwner(apps, foreground.processId);
	return (
		owner ??
		apps.find((app) => isSameImageName(app.imageName, foreground.imageName))
	);
}
