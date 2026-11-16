const ADDRESS_EVENT = 'unitAddress';
const LANGUAGE_EVENT = 'language';
const SAVE_RESULT_EVENT = 'saveUnitAddressResult';
const FRENCH = 'fr';
const CHECKING_MESSAGES = {
	en: 'Checking the unit...',
	fr: "Vérification de l'unité...",
};

const addressField = document.getElementById('unit-address');
const saveButton = document.getElementById('save-address');
const statusMessage = document.getElementById('address-status');
const languageSelect = document.getElementById('language-select');
const streamDeckClient = SDPIComponents.streamDeckClient;
let currentLanguage = 'en';

/** Remembers the English text of an element the first time, so English can be put back after French. */
function rememberEnglish(element, key, read) {
	element.dataset[key] ??= read();
}

/** Puts the text of the elements that carry a French text in the language: English is the text written in the page. */
function applyLanguage(language) {
	currentLanguage = language;
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
}

streamDeckClient.sendToPropertyInspector.subscribe((event) => {
	const payload = event.payload;
	if (payload?.event === ADDRESS_EVENT) {
		addressField.value = payload.address;
	}
	if (payload?.event === LANGUAGE_EVENT) {
		languageSelect.value = payload.setting;
		applyLanguage(payload.language);
	}
	if (payload?.event === SAVE_RESULT_EVENT) {
		saveButton.disabled = false;
		statusMessage.textContent = payload.message;
	}
});

saveButton.addEventListener('click', () => {
	saveButton.disabled = true;
	statusMessage.textContent = CHECKING_MESSAGES[currentLanguage];
	streamDeckClient.send('sendToPlugin', {
		event: 'saveUnitAddress',
		address: addressField.value,
	});
});

languageSelect.addEventListener('change', () => {
	streamDeckClient.send('sendToPlugin', {
		event: 'saveLanguage',
		setting: languageSelect.value,
	});
});

streamDeckClient.send('sendToPlugin', { event: 'getUnitAddress' });
streamDeckClient.send('sendToPlugin', { event: 'getLanguage' });
