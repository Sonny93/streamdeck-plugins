import { DaikinError } from '../daikin/errors/daikin_error';
import { UnitUnreachableError } from '../daikin/errors/unit_unreachable_error';
import type { UnitDriver } from '../daikin/unit_driver';
import { validateUnitAddress } from './validate_unit_address';

export type SaveUnitAddressDependencies = Readonly<{
	createDriver: (host: string) => UnitDriver;
	persistHost: (host: string) => Promise<void>;
	applyHost: (host: string) => void;
	onError: (error: unknown) => void;
}>;

/** What came of saving an address: it is saved, or why it was refused. */
export type SaveUnitAddressOutcome =
	| 'saved'
	| 'invalid'
	| 'no-answer'
	| 'incompatible';

type IdentityCheck = Extract<
	SaveUnitAddressOutcome,
	'saved' | 'no-answer' | 'incompatible'
>;

async function checkUnit(
	driver: UnitDriver,
	onError: (error: unknown) => void
): Promise<IdentityCheck> {
	try {
		const identity = await driver.readIdentity();
		return identity.apiFamily === 'local-http' ? 'saved' : 'incompatible';
	} catch (error) {
		if (error instanceof UnitUnreachableError) {
			return 'no-answer';
		}
		if (error instanceof DaikinError) {
			return 'incompatible';
		}
		onError(error);
		return 'no-answer';
	}
}

/**
 * Saves the address of the unit typed in a property inspector: it must be a private IPv4 literal, and the unit must answer
 * as one with the local HTTP API. Only then is it persisted and handed to the hub. Persisting errors are left to the caller.
 */
export async function saveUnitAddress(
	address: string,
	dependencies: SaveUnitAddressDependencies
): Promise<SaveUnitAddressOutcome> {
	const host = validateUnitAddress(address);
	if (host === undefined) {
		return 'invalid';
	}
	const check = await checkUnit(
		dependencies.createDriver(host),
		dependencies.onError
	);
	if (check !== 'saved') {
		return check;
	}
	await dependencies.persistHost(host);
	dependencies.applyHost(host);
	return 'saved';
}
