// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { mockSOSList } from '../data/mockData';

// const SOSContext = createContext(null);

// export const SOSProvider = ({ children }) => {
// 	console.log('SOSContext render');
// 	const [sosList, setSOSList] = useState(mockSOSList);
// 	useEffect(() => {
// 		console.log('SOSProvider MOUNTED');
// 		return () => console.log('SOSProvider UNMOUNTED');
// 	}, []);

// 	const updateSOS = (sosId, { status, timelineEvent }) => {
// 		const time = new Date().toLocaleTimeString('en-US', { hour12: false });

// 		setSOSList((prev) =>
// 			prev.map((sos) => {
// 				if (sos.sosId !== sosId) return sos;

// 				return {
// 					...sos,
// 					status: status ?? sos.status,
// 					timeline: timelineEvent
// 						? [...sos.timeline, { time, event: timelineEvent, type: 'info' }]
// 						: sos.timeline,
// 				};
// 			}),
// 		);
// 	};

// 	return (
// 		<SOSContext.Provider
// 			value={{
// 				sosList,
// 				updateSOS,
// 			}}>
// 			{children}
// 		</SOSContext.Provider>
// 	);
// };

// export const useSOSContext = () => {
// 	const ctx = useContext(SOSContext);
// 	if (!ctx) {
// 		throw new Error('useSOSContext must be used inside SOSProvider');
// 	}
// 	return ctx;
// };

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SOSContext = createContext(null);

export const SOSProvider = ({ children }) => {
	const [sosList, setSOSList] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		console.log('SOSProvider MOUNTED');

		const fetchSOS = async () => {
			try {
				const response = await axios.get('http://35.200.145.77/alerts');
				console.log(response.data);
				setSOSList(response.data.alerts);
			} catch (err) {
				console.error('Failed to fetch SOS alerts:', err);
				setError('Failed to load SOS alerts');
			} finally {
				setLoading(false);
			}
		};

		fetchSOS();

		return () => console.log('SOSProvider UNMOUNTED');
	}, []);

	// 🔄 UPDATE SOS (status + timeline)
	const updateSOS = (sosId, { status, timelineEvent }) => {
		const time = new Date().toLocaleTimeString('en-US', { hour12: false });

		setSOSList((prev) =>
			prev.map((sos) => {
				if (sos.sosId !== sosId) return sos;

				return {
					...sos,
					status: status ?? sos.status,
					timeline: timelineEvent
						? [...sos.timeline, { time, event: timelineEvent, type: 'info' }]
						: sos.timeline,
				};
			}),
		);
	};

	return (
		<SOSContext.Provider
			value={{
				sosList,
				loading,
				error,
				updateSOS,
			}}>
			{children}
		</SOSContext.Provider>
	);
};

export const useSOSContext = () => {
	const ctx = useContext(SOSContext);
	if (!ctx) {
		throw new Error('useSOSContext must be used inside SOSProvider');
	}
	return ctx;
};
