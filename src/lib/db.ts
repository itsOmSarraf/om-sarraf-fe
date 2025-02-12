import Dexie, { Table } from 'dexie';

export interface Slot {
	id?: number;
	userId: string;
	userName: string;
	date: string;
	startTime: string;
	endTime: string;
	timezone?: string;
	isFake: boolean;
}

export class MyDatabase extends Dexie {
	slots!: Table<Slot>;

	constructor() {
		super('myDatabase');

		this.version(2).stores({
			slots: '++id, userId, date, startTime, endTime, isFake'
		});
	}
}

export const db = new MyDatabase();
