import type { GlobalSettingsPort } from '../settings/global_settings_port';
import { mergeGlobalSettings } from '../settings/merge_global_settings';
import type { Language } from './language';
import type { LanguageSetting } from './language_setting';
import { languageSettingsSchema } from './language_settings_schema';
import { resolveLanguage } from './resolve_language';

type LanguageListener = () => void;

export type LanguageStoreOptions = Readonly<{
	settings: GlobalSettingsPort;
	/** The locale of the system, read once the first time it is needed. */
	readSystemLocale: () => string;
	onError: (error: unknown) => void;
}>;

/**
 * Holds the language setting of a plugin, persisted in its global settings next to its other settings,
 * and the language it resolves to. Listeners hear every change, so what is drawn can be drawn again.
 */
export class LanguageStore {
	private readonly listeners = new Set<LanguageListener>();
	private currentSetting: LanguageSetting = 'system';
	private systemLocale: string | undefined;

	constructor(private readonly options: LanguageStoreOptions) {}

	get setting(): LanguageSetting {
		return this.currentSetting;
	}

	/** The language to draw in now. */
	get current(): Language {
		this.systemLocale ??= this.options.readSystemLocale();
		return resolveLanguage(this.currentSetting, this.systemLocale);
	}

	/** Reads the setting from the global settings; a missing or invalid one follows the system. */
	async load(): Promise<void> {
		const parsed = languageSettingsSchema.safeParse(
			await this.options.settings.read()
		);
		this.apply(parsed.success ? (parsed.data.language ?? 'system') : 'system');
	}

	/** Persists the setting without touching the other global settings, then applies it and tells the listeners. */
	async save(setting: LanguageSetting): Promise<void> {
		await mergeGlobalSettings(this.options.settings, { language: setting });
		this.apply(setting);
	}

	/** Registers a listener called on every change, and returns the function that unsubscribes it. */
	subscribe(listener: LanguageListener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	private apply(setting: LanguageSetting): void {
		const previousSetting = this.currentSetting;
		const previousLanguage = this.current;
		this.currentSetting = setting;
		if (setting !== previousSetting || this.current !== previousLanguage) {
			this.notify();
		}
	}

	private notify(): void {
		for (const listener of this.listeners) {
			try {
				listener();
			} catch (error) {
				this.options.onError(error);
			}
		}
	}
}
