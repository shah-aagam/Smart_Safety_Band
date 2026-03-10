// import React, { useMemo, useState, useRef, useEffect } from 'react';
// import { GoogleMap, Marker, Circle, InfoWindow } from '@react-google-maps/api';
// import { MapPin } from 'lucide-react';

// /* -------- FAKE CCTV GENERATOR -------- */

// const generateFakeCCTVs = (lat, lng, count = 4) => {
// 	return Array.from({ length: count }).map((_, i) => {
// 		const distance = 50 + Math.random() * 50;
// 		const angle = Math.random() * 2 * Math.PI;

// 		const latOffset = (distance / 111000) * Math.cos(angle);
// 		const lngOffset =
// 			(distance / (111000 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);

// 		return {
// 			id: `CCTV_${i + 1}`,
// 			name: `CCTV Camera ${i + 1}`,
// 			lat: lat + latOffset,
// 			lng: lng + lngOffset,
// 			distance: Math.round(distance),
// 		};
// 	});
// };

// const MapTab = ({ sos }) => {
// 	const mapRef = useRef(null);
// 	const [selectedMarker, setSelectedMarker] = useState(null);

// 	const position = {
// 		lat: sos.location.lat,
// 		lng: sos.location.lng,
// 	};

// 	const cctvs = useMemo(
// 		() => generateFakeCCTVs(position.lat, position.lng),
// 		[position.lat, position.lng]
// 	);

// 	const nearestCCTV = cctvs.reduce((a, b) => (a.distance < b.distance ? a : b));

// 	// 🔑 Reset selection when user changes
// 	useEffect(() => {
// 		setSelectedMarker(null);
// 	}, [sos.sosId]);

// 	const handleMapLoad = (map) => {
// 		mapRef.current = map;

// 		// 🔥 FORCE GOOGLE MAPS TO RENDER PROPERLY
// 		setTimeout(() => {
// 			map.panTo(position);
// 			window.google.maps.event.trigger(map, 'resize');
// 		}, 0);
// 	};

// 	return (
// 		<div className="space-y-4">
// 			<div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
// 				<strong>Nearest CCTV:</strong> {nearestCCTV.name} •{' '}
// 				{nearestCCTV.distance}m
// 			</div>

// 			<div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200">
// 				<GoogleMap
// 					onLoad={handleMapLoad}
// 					mapContainerStyle={{ width: '100%', height: '100%' }}
// 					center={position}
// 					zoom={16}>
// 					<Marker
// 						position={position}
// 						label={{ text: 'SOS', color: 'white', fontWeight: 'bold' }}
// 						onClick={() => setSelectedMarker('sos')}
// 					/>

// 					<Circle
// 						center={position}
// 						radius={sos.location.accuracy}
// 						options={{
// 							fillColor: '#ef4444',
// 							fillOpacity: 0.15,
// 							strokeColor: '#ef4444',
// 						}}
// 					/>

// 					{cctvs.map((cctv, i) => (
// 						<Marker
// 							key={cctv.id}
// 							position={{ lat: cctv.lat, lng: cctv.lng }}
// 							label={`${i + 1}`}
// 							onClick={() => setSelectedMarker(cctv.id)}
// 						/>
// 					))}

// 					{selectedMarker === 'sos' && (
// 						<InfoWindow
// 							position={position}
// 							onCloseClick={() => setSelectedMarker(null)}>
// 							<div>
// 								<strong>{sos.userName}</strong>
// 								<p>SOS Location</p>
// 							</div>
// 						</InfoWindow>
// 					)}

// 					{cctvs.map(
// 						(cctv) =>
// 							selectedMarker === cctv.id && (
// 								<InfoWindow
// 									key={cctv.id}
// 									position={{ lat: cctv.lat, lng: cctv.lng }}
// 									onCloseClick={() => setSelectedMarker(null)}>
// 									<div>
// 										<strong>{cctv.name}</strong>
// 										<p>{cctv.distance}m away</p>
// 									</div>
// 								</InfoWindow>
// 							)
// 					)}
// 				</GoogleMap>
// 			</div>

// 			<div className="bg-white border border-gray-200 p-3 rounded text-sm text-gray-600">
// 				<MapPin
// 					size={14}
// 					className="inline mr-2 text-blue-500"
// 				/>
// 				{sos.location.address}
// 			</div>
// 		</div>
// 	);
// };

// export default MapTab;

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import { policeData } from '../data/policeData';

/* -------- FAKE CCTV GENERATOR -------- */

const generateFakeCCTVs = (lat, lng, count = 4) => {
	return Array.from({ length: count }).map((_, i) => {
		const distance = 50 + Math.random() * 50;
		const angle = Math.random() * 2 * Math.PI;

		const latOffset = (distance / 111000) * Math.cos(angle);
		const lngOffset =
			(distance / (111000 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);

		return {
			id: `CCTV_${i + 1}`,
			name: `CCTV Camera ${i + 1}`,
			lat: lat + latOffset,
			lng: lng + lngOffset,
			distance: Math.round(distance),
		};
	});
};

//police stations

const haversineDistance = (lat1, lon1, lat2, lon2) => {
	const R = 6371; // km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) ** 2;

	return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const MapTab = ({ sos }) => {
	const mapRef = useRef(null);
	const [selectedMarker, setSelectedMarker] = useState(null);

	// ✅ FIX: backend uses `long`, not `lng`
	const position = useMemo(
		() => ({
			lat: Number(sos.location.lat),
			lng: Number(sos.location.long),
		}),
		[sos.location.lat, sos.location.long],
	);

	const nearestPoliceStations = useMemo(() => {
		return policeData
			.map((ps) => ({
				...ps,
				distance: haversineDistance(
					position.lat,
					position.lng,
					ps.latitude,
					ps.longitude,
				),
			}))
			.sort((a, b) => a.distance - b.distance)
			.slice(0, 5);
	}, [position.lat, position.lng]);
	useEffect(() => {
		console.log('🚓 Nearest 5 Police Stations:');
		nearestPoliceStations.forEach((ps, i) => {
			console.log(`${i + 1}. ${ps.name} | ${ps.distance.toFixed(2)} km`);
		});
	}, [nearestPoliceStations]);

	const cctvs = useMemo(
		() => generateFakeCCTVs(position.lat, position.lng),
		[position.lat, position.lng],
	);

	const nearestCCTV = useMemo(
		() => cctvs.reduce((a, b) => (a.distance < b.distance ? a : b)),
		[cctvs],
	);

	// Reset popup on SOS change
	useEffect(() => {
		setSelectedMarker(null);
	}, [sos.sosId]);

	const handleMapLoad = (map) => {
		mapRef.current = map;

		// Force proper render
		setTimeout(() => {
			map.panTo(position);
			window.google.maps.event.trigger(map, 'resize');
		}, 0);
	};

	return (
		<div className="space-y-4">
			<div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
				<strong>Nearest CCTV:</strong> {nearestCCTV.name} •{' '}
				{nearestCCTV.distance}m
			</div>

			<div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200">
				<GoogleMap
					onLoad={handleMapLoad}
					mapContainerStyle={{ width: '100%', height: '100%' }}
					center={position}
					zoom={16}>
					{/* SOS Marker */}
					<Marker
						position={position}
						label={{ text: 'SOS', color: 'white', fontWeight: 'bold' }}
						onClick={() => setSelectedMarker('sos')}
					/>

					{/* Accuracy Circle */}
					<Circle
						center={position}
						radius={sos.location.accuracy}
						options={{
							fillColor: '#ef4444',
							fillOpacity: 0.15,
							strokeColor: '#ef4444',
						}}
					/>

					{/* CCTV Markers */}
					{cctvs.map((cctv, i) => (
						<Marker
							key={cctv.id}
							position={{ lat: cctv.lat, lng: cctv.lng }}
							label={`${i + 1}`}
							onClick={() => setSelectedMarker(cctv.id)}
						/>
					))}

					{/* SOS Info */}
					{selectedMarker === 'sos' && (
						<InfoWindow
							position={position}
							onCloseClick={() => setSelectedMarker(null)}>
							<div>
								<strong>{sos.userName}</strong>
								<p>Device: {sos.deviceId}</p>
								<p>Status: {sos.status}</p>
							</div>
						</InfoWindow>
					)}
					{nearestPoliceStations.map((ps, i) => (
						<Marker
							key={ps.name}
							position={{ lat: ps.latitude, lng: ps.longitude }}
							icon={{
								url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
							}}
							label={`${i + 1}`}
						/>
					))}

					{/* CCTV Info */}
					{cctvs.map(
						(cctv) =>
							selectedMarker === cctv.id && (
								<InfoWindow
									key={cctv.id}
									position={{ lat: cctv.lat, lng: cctv.lng }}
									onCloseClick={() => setSelectedMarker(null)}>
									<div>
										<strong>{cctv.name}</strong>
										<p>{cctv.distance}m away</p>
									</div>
								</InfoWindow>
							),
					)}
				</GoogleMap>
			</div>

			{/* Location summary (no address available from backend) */}
			<div className="bg-white border border-gray-200 p-3 rounded text-sm text-gray-600">
				<MapPin
					size={14}
					className="inline mr-2 text-blue-500"
				/>
				Lat: {position.lat}, Lng: {position.lng} • Accuracy ±
				{sos.location.accuracy}m
			</div>
		</div>
	);
};

export default MapTab;
