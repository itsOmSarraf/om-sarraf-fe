// Color palettes
export const CALENDAR_COLORS = {
	userColors: [
		'#34d399', // emerald
		'#f87171', // red
		'#60a5fa', // blue
		'#c084fc', // purple
		'#fbbf24', // amber
		'#34d399', // emerald
		'#f472b6', // pink
		'#818cf8', // indigo
		'#fb923c', // orange
		'#4ade80' // green
	],
	userBorderColors: [
		'#059669', // darker emerald
		'#dc2626', // darker red
		'#2563eb', // darker blue
		'#9333ea', // darker purple
		'#d97706', // darker amber
		'#059669', // darker emerald
		'#db2777', // darker pink
		'#4f46e5', // darker indigo
		'#ea580c', // darker orange
		'#16a34a' // darker green
	],
	ownSlot: {
		background: '#2563eb',
		border: '#1d4ed8'
	},
	text: '#000000'
};

// Time blocks for fake slots
export const TIME_BLOCKS = [
	{ start: '06:30', end: '07:00' },
	{ start: '07:00', end: '08:00' },
	{ start: '08:00', end: '09:00' },
	{ start: '09:00', end: '10:00' },
	{ start: '10:00', end: '10:30' },
	{ start: '10:30', end: '11:00' },
	{ start: '11:00', end: '12:00' },
	{ start: '13:00', end: '13:30' },
	{ start: '13:30', end: '14:00' },
	{ start: '14:00', end: '14:30' },
	{ start: '14:30', end: '15:00' },
	{ start: '15:00', end: '15:30' },
	{ start: '15:30', end: '16:00' },
	{ start: '16:00', end: '17:00' },
	{ start: '17:00', end: '17:30' },
	{ start: '17:30', end: '18:00' },
	{ start: '18:30', end: '19:00' },
	{ start: '20:00', end: '21:00' }
];

// Calendar view settings
export const CALENDAR_SETTINGS = {
	slotMinTime: '06:00:00',
	slotMaxTime: '22:00:00',
	viewBreakpoints: {
		mobile: 768,
		tablet: 1024
	},
	dateRange: {
		start: 10,
		end: 28,
		month: '02',
		year: '2025'
	}
};

// Probability settings
export const PROBABILITY = {
	hourLongSlot: 0.3 // 30% chance of hour-long slot
};
