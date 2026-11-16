/*
 * Browser side of the language select that the property inspectors of a plugin share.
 * deck-kit owns this file: each plugin build copies it next to its bundle (bin/language_inspector.js), and its pages load it from there.
 * The English text is the text written in the page; an element with a French text carries it in an attribute:
 * data-fr for its text, data-fr-label for its label attribute, data-fr-placeholder for its placeholder, data-fr-loading for its loading attribute.
 * A plugin script can read InspectorLanguage.current, the language the plugin last sent,
 * and listen to the "inspectorlanguagechange" event on document, fired when that language changes.
 */
const InspectorLanguage = { current: 'en' };

(function () {
	const LANGUAGE_EVENT = 'language';
	const LANGUAGE_CHANGE_EVENT = 'inspectorlanguagechange';
	const FRENCH = 'fr';
	const languageSelect = document.getElementById('language-select');
	const streamDeckClient = SDPIComponents.streamDeckClient;

	function rememberEnglish(element, key, read) {
		element.dataset[key] ??= read();
	}

	function applyLanguage(language) {
		const hasChanged = InspectorLanguage.current !== language;
		InspectorLanguage.current = language;
		document.documentElement.lang = language;
		for (const element of document.querySelectorAll('[data-fr]')) {
			rememberEnglish(element, 'en', () => element.textContent);
			element.textContent =
				language === FRENCH ? element.dataset.fr : element.dataset.en;
		}
		for (const element of document.querySelectorAll('[data-fr-label]')) {
			rememberEnglish(element, 'enLabel', () => element.getAttribute('label'));
			element.setAttribute(
				'label',
				language === FRENCH ? element.dataset.frLabel : element.dataset.enLabel
			);
		}
		for (const element of document.querySelectorAll('[data-fr-placeholder]')) {
			rememberEnglish(element, 'enPlaceholder', () =>
				element.getAttribute('placeholder')
			);
			element.setAttribute(
				'placeholder',
				language === FRENCH
					? element.dataset.frPlaceholder
					: element.dataset.enPlaceholder
			);
		}
		for (const element of document.querySelectorAll('[data-fr-loading]')) {
			rememberEnglish(element, 'enLoading', () =>
				element.getAttribute('loading')
			);
			element.setAttribute(
				'loading',
				language === FRENCH
					? element.dataset.frLoading
					: element.dataset.enLoading
			);
		}
		if (hasChanged) {
			document.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
		}
	}

	streamDeckClient.sendToPropertyInspector.subscribe((event) => {
		const payload = event.payload;
		if (payload?.event !== LANGUAGE_EVENT) {
			return;
		}
		languageSelect.value = payload.setting;
		applyLanguage(payload.language);
	});

	languageSelect.addEventListener('change', () => {
		streamDeckClient.send('sendToPlugin', {
			event: 'saveLanguage',
			setting: languageSelect.value,
		});
	});

	streamDeckClient.send('sendToPlugin', { event: 'getLanguage' });
})();
