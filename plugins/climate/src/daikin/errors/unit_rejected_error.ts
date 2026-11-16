import { DaikinError } from './daikin_error';

export class UnitRejectedError extends DaikinError {
	readonly code = 'E_UNIT_REJECTED';
	readonly ret: string;

	constructor(ret: string) {
		super(`Unit answered ret=${ret}`);
		this.ret = ret;
	}
}
