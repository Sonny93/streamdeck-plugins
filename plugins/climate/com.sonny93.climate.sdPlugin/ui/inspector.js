const ADDRESS_EVENT = 'unitAddress';
const SAVE_RESULT_EVENT = 'saveUnitAddressResult';
const CHECKING_MESSAGES = {
	en: 'Checking the unit...',
	fr: "Vérification de l'unité...",
};

const addressField = document.getElementById('unit-address');
const saveButton = document.getElementById('save-address');
const statusMessage = document.getElementById('address-status');
const streamDeckClient = SDPIComponents.streamDeckClient;

streamDeckClient.sendToPropertyInspector.subscribe((event) => {
	const payload = event.payload;
	if (payload?.event === ADDRESS_EVENT) {
		addressField.value = payload.address;
	}
	if (payload?.event === SAVE_RESULT_EVENT) {
		saveButton.disabled = false;
		statusMessage.textContent = payload.message;
	}
});

saveButton.addEventListener('click', () => {
	saveButton.disabled = true;
	statusMessage.textContent = CHECKING_MESSAGES[InspectorLanguage.current];
	streamDeckClient.send('sendToPlugin', {
		event: 'saveUnitAddress',
		address: addressField.value,
	});
});

streamDeckClient.send('sendToPlugin', { event: 'getUnitAddress' });
