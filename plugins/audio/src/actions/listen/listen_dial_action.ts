import type {
	DialDownEvent,
	DialRotateEvent,
	DialUpEvent,
	TouchTapEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';
import type { LanguageStore } from 'deck-kit/i18n/language_store';
import type { IdlePanel } from 'deck-kit/strip/idle_panel';
import { StripDialSurface } from 'deck-kit/strip/strip_dial_surface';

import type { ListenHub } from '../../listen/listen_hub';
import type { ListenView } from '../../listen/listen_view';
import { buildListenDialSvg } from '../strip/build_listen_dial_svg';
import { ListenAction } from './listen_action';
import type { ListenActionSettings } from './listen_action_settings';
import type { ListenTarget } from './listen_target';

/**
 * Stream Deck+ dial that plays an input, such as a console on a line jack, in the default output.
 * Press the dial or tap the strip to start or stop listening, rotate to change the level, never above the maximum level of its settings.
 * The strip shows the idle panel of the plugin once the Stream Deck is inactive;
 * the first gesture after the panel only wakes the dials, so every event starts with `consumeWake`.
 */
export class ListenDialAction extends ListenAction {
	override readonly manifestId = 'com.sonny93.audio.listen';

	private readonly surface: StripDialSurface;

	constructor(
		hub: ListenHub | undefined,
		languageStore: LanguageStore,
		idle: IdlePanel
	) {
		super(hub, languageStore);
		this.surface = new StripDialSurface({
			idle,
			redraw: () => {
				void this.redrawAll();
			},
		});
	}

	override async onWillAppear(
		ev: WillAppearEvent<ListenActionSettings>
	): Promise<void> {
		if (ev.action.isDial()) {
			this.surface.appear(ev.action);
		}
		await super.onWillAppear(ev);
	}

	override onWillDisappear(ev: WillDisappearEvent<ListenActionSettings>): void {
		this.surface.disappear(ev.action.id);
		super.onWillDisappear(ev);
	}

	override async onDialRotate(
		ev: DialRotateEvent<ListenActionSettings>
	): Promise<void> {
		if (this.surface.consumeWake('other')) {
			return;
		}
		await this.runChange(ev.action, (hub, target) =>
			hub.changeLevel(target.sourceId, ev.payload.ticks, target.maximumLevel)
		);
	}

	override async onDialDown(
		ev: DialDownEvent<ListenActionSettings>
	): Promise<void> {
		if (this.surface.consumeWake('press')) {
			return;
		}
		await this.toggle(ev.action);
	}

	override onDialUp(_ev: DialUpEvent<ListenActionSettings>): void {
		this.surface.consumeWake('release');
	}

	override async onTouchTap(
		ev: TouchTapEvent<ListenActionSettings>
	): Promise<void> {
		if (this.surface.consumeWake('other')) {
			return;
		}
		await this.toggle(ev.action);
	}

	private async toggle(
		action: WillAppearEvent<ListenActionSettings>['action']
	): Promise<void> {
		await this.runChange(action, (hub, target) =>
			hub.toggle(target.sourceId, target.maximumLevel)
		);
	}

	protected override async render(
		dialAction: WillAppearEvent<ListenActionSettings>['action'],
		target: ListenTarget,
		view: ListenView | undefined,
		language: Language
	): Promise<void> {
		if (!dialAction.isDial()) {
			return;
		}
		const level =
			target.sourceId === undefined
				? 0
				: (this.hub?.levelOf(target.sourceId, target.maximumLevel) ?? 0);
		await this.surface.draw(dialAction, (column) =>
			buildListenDialSvg({
				view,
				sourceId: target.sourceId,
				level,
				maximumLevel: target.maximumLevel,
				language,
				column,
			})
		);
	}
}
