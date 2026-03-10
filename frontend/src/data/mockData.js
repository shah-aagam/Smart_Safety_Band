// Mock SOS Alert Data
export const mockSOSList = [
	{
		sosId: 'SOS_1023',
		userName: 'Ravi Kumar',
		deviceId: 'A9G_09',
		heartbeat: 132,
		heartbeatStatus: 'HIGH',
		location: {
			lat: 12.9716,
			lng: 77.5946,
			address: 'MG Road, Block 12, Brigade Road, Bengaluru, Karnataka 560001',
			source: 'GPS',
			accuracy: 15,
		},
		signalStrength: -78,
		networkMode: 'DATA',
		lastUpdate: '2026-01-08T12:30:21',
		status: 'ACTIVE',
		distressType: 'Touch based',
		timeline: [
			{ time: '12:30:21', event: 'SOS triggered', type: 'critical' },
			{ time: '12:30:25', event: 'Location updated', type: 'info' },
			{
				time: '12:30:30',
				event: 'Heartbeat abnormal detected',
				type: 'warning',
			},
		],
	},
	{
		sosId: 'SOS_1024',
		userName: 'Priya Sharma',
		deviceId: 'A9G_12',
		heartbeat: 88,
		heartbeatStatus: 'NORMAL',
		location: {
			lat: 12.9352,
			lng: 77.6245,
			address:
				'Whitefield, Block 5, ITPL Main Road, Bengaluru, Karnataka 560066',
			source: 'GPS',
			accuracy: 20,
		},
		signalStrength: -65,
		networkMode: 'DATA',
		lastUpdate: '2026-01-08T12:28:15',
		status: 'ACTIVE',
		distressType: 'Voice based',
		timeline: [
			{ time: '12:28:15', event: 'SOS triggered', type: 'critical' },
			{ time: '12:28:20', event: 'Location updated', type: 'info' },
		],
	},
	{
		sosId: 'SOS_1022',
		userName: 'Amit Patel',
		deviceId: 'A9G_07',
		heartbeat: 72,
		heartbeatStatus: 'NORMAL',
		location: {
			lat: 12.9141,
			lng: 77.6411,
			address:
				'HSR Layout, Sector 1, 27th Main Road, Bengaluru, Karnataka 560102',
			source: 'GPS',
			accuracy: 10,
		},
		signalStrength: -82,
		networkMode: 'SMS',
		lastUpdate: '2026-01-08T12:25:42',
		status: 'RESOLVED',
		distressType: 'Movement based',
		timeline: [
			{ time: '12:25:42', event: 'SOS triggered', type: 'critical' },
			{ time: '12:26:00', event: 'Admin viewed', type: 'info' },
			{ time: '12:27:30', event: 'SOS resolved', type: 'success' },
		],
	},
	{
		sosId: 'SOS_1025',
		userName: 'Sneha Reddy',
		deviceId: 'A9G_15',
		heartbeat: 145,
		heartbeatStatus: 'HIGH',
		location: {
			lat: 12.9698,
			lng: 77.75,
			address:
				'Marathahalli, Block 8, Outer Ring Road, Bengaluru, Karnataka 560037',
			source: 'GPS',
			accuracy: 18,
		},
		signalStrength: -70,
		networkMode: 'DATA',
		lastUpdate: '2026-01-08T12:31:05',
		status: 'ACTIVE',
		distressType: 'Touch based',
		timeline: [
			{ time: '12:31:05', event: 'SOS triggered', type: 'critical' },
			{
				time: '12:31:08',
				event: 'Heartbeat abnormal detected',
				type: 'warning',
			},
		],
	},
];

// Mock CCTV Locations
export const mockCCTVLocations = [
	{ id: 'CCTV_01', lat: 12.972, lng: 77.595, name: 'MG Road Junction' },
	{ id: 'CCTV_02', lat: 12.971, lng: 77.594, name: 'Brigade Road Corner' },
	{ id: 'CCTV_03', lat: 12.9355, lng: 77.625, name: 'Whitefield Main Gate' },
];
