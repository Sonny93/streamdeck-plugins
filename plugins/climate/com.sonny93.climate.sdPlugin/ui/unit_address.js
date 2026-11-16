const ADDRESS_EVENT = 'unitAddress';
const SAVE_RESULT_EVENT = 'saveUnitAddressResult';
const CHECKING_MESSAGE = "Vérification de l'unité...";

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
	statusMessage.textContent = CHECKING_MESSAGE;
	streamDeckClient.send('sendToPlugin', {
		event: 'saveUnitAddress',
		address: addressField.value,
	});
});

streamDeckClient.send('sendToPlugin', { event: 'getUnitAddress' });
