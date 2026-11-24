import type { Scheduler } from 'deck-kit/async/scheduler';
import type { GlobalSettingsPort } from 'deck-kit/settings/global_settings_port';
import { mergeGlobalSettings } from 'deck-kit/settings/merge_global_settings';
import { z } from 'zod';

import { ListenTiming } from './listen_timing';

const LEVELS_KEY = 'listenLevels';

const levelsSchema = z.object({
	[LEVELS_KEY]: z.record(z.string(), z.number().min(0).max(1)),
});

type RememberedLevelsOptions = Readonly<{
	settings: GlobalSettingsPort;
	schedule: Scheduler;
	onError: (error: unknown) => void;
}>;

/**
 * The level of each source, kept in the global settings.
 * A save waits for the last change of a burst and runs apart from the safety queue, after the saves before it,
 * so a settings call that hangs never holds back a read or a cut.
 */
export class RememberedLevels {
	private readonly levels = new Map<string, number>();
	private cancelSave: (() => void) | undefined;
	private lastSave: Promise<void> = Promise.resolve();

	constructor(private readonly options: RememberedLevelsOptions) {}

	async load(): Promise<void> {
		try {
			const parsed = levelsSchema.safeParse(await this.options.settings.read());
			if (!parsed.success) {
				return;
			}
			for (const [sourceId, level] of Object.entries(parsed.data[LEVELS_KEY])) {
				this.levels.set(sourceId, level);
			}
		} catch (error) {
			this.options.onError(error);
		}
	}

	get(sourceId: string): number | undefined {
		return this.levels.get(sourceId);
	}

	set(sourceId: string, level: number): void {
		this.levels.set(sourceId, level);
		this.cancelSave?.();
		this.cancelSave = this.options.schedule(() => {
			this.cancelSave = undefined;
			this.lastSave = this.lastSave.then(() => this.save());
		}, ListenTiming.levelSaveDelayMilliseconds);
	}

	private async save(): Promise<void> {
		try {
			await mergeGlobalSettings(this.options.settings, {
				[LEVELS_KEY]: Object.fromEntries(this.levels),
			});
		} catch (error) {
			this.options.onError(error);
		}
	}
}
