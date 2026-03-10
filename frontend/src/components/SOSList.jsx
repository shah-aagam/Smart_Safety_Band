import React, { useState } from 'react';
import { Activity, Radio, Clock, Wifi, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSOSContext } from '../context/SOSContext';
import { StatusBadge, SignalBars } from '../utils/UtilityComponent';

const SOSList = ({ filterStatus }) => {
	const { sosList } = useSOSContext();
	const navigate = useNavigate();

	const [hoveredSOS, setHoveredSOS] = useState(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

	const filteredList = filterStatus
		? sosList.filter((sos) => sos.status === filterStatus)
		: sosList;

	const sortedList = [...filteredList].sort((a, b) => {
		const timeA = new Date(a.updatedAt || a.createdAt).getTime();
		const timeB = new Date(b.updatedAt || b.createdAt).getTime();
		return timeB - timeA;
	});

	const handleMouseMove = (e, sos) => {
		setHoveredSOS(sos);
		setMousePos({
			x: Math.min(e.clientX + 16, window.innerWidth - 280),
			y: Math.min(e.clientY + 16, window.innerHeight - 200),
		});
	};
	console.log('Sos list', sosList[0]);												 
	
	return (
		<div className="p-6 bg-transparent min-h-screen">
			<h3 className="text-2xl font-bold text-gray-900 mb-6">
				{filterStatus ? `${filterStatus} SOS Alerts` : 'All SOS Alerts'}
			</h3>

			{sortedList.length === 0 ? (
				<div className="text-center py-12 text-gray-400">
					<AlertTriangle
						size={48}
						className="mx-auto mb-4 opacity-40"
					/>
					<p>No {filterStatus?.toLowerCase()} SOS alerts</p>
				</div>
			) : (
				<div className="grid gap-4">
					{sortedList.map((sos) => (
						<div
							key={sos.sosId}
							onMouseMove={(e) => handleMouseMove(e, sos)}
							onMouseLeave={() => setHoveredSOS(null)}
							onClick={() => navigate(`/${sos.sosId}`)}
							className="relative bg-white border border-gray-200 rounded-xl shadow-lg p-5 hover:shadow-md transition cursor-pointer hover:scale-1.5">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-3">
										<h4 className="text-lg font-semibold text-gray-900">
											{sos.userName}
										</h4>
										<StatusBadge status={sos.status} />
									</div>

									<div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
										<div className="flex items-center gap-2 text-gray-500">
											<Radio size={14} />
											<span>Device: {sos.deviceId}</span>
										</div>

										<div className="flex items-center gap-2">
											<Activity
												size={14}
												className={
													sos.heartbeatStatus === 'HIGH'
														? 'text-red-500'
														: sos.heartbeatStatus === 'LOW'
															? 'text-yellow-500'
															: 'text-green-600'
												}
											/>
											<span
												className={
													sos.heartbeatStatus === 'HIGH'
														? 'text-red-500 font-semibold'
														: sos.heartbeatStatus === 'LOW'
															? 'text-yellow-600'
															: 'text-gray-600'
												}>
												{sos.heartbeat} BPM
											</span>
										</div>

										<div className="flex items-center gap-2 text-gray-500">
											<Clock size={14} />
											<span>
													{new Date(sos.createdAt).toLocaleDateString("en-GB")}
											</span>
										</div>

										<div className="flex items-center gap-2 text-gray-500">
											{/* <Wifi size={14} /> */}
											{/* <SignalBars strength={sos.signalStrength} /> */}
											{/* <span className="ml-1">{sos.networkMode}</span> */}
										</div>
									</div>
								</div>

								<div className="text-gray-400">→</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* HOVER TOOLTIP */}
			{hoveredSOS && (
				<div
					className="fixed z-50 w-64 bg-white border border-gray-200 rounded-lg p-4 shadow-xl pointer-events-none"
					style={{ top: mousePos.y, left: mousePos.x }}>
					<div className="space-y-2 text-sm">
						<div>
							<span className="text-gray-500">Distress Type:</span>
							<span className="text-gray-900 font-semibold ml-2">
								{hoveredSOS.distressType}
							</span>
						</div>
						<div>
							<span className="text-gray-500">Location Accuracy:</span>
							<span className="text-gray-900 ml-2">
								{hoveredSOS.location.accuracy}m
							</span>
						</div>
						<div>
							<span className="text-gray-500">Signal:</span>
							<span className="text-gray-900 ml-2">
								{hoveredSOS.signalStrength} dBm
							</span>
						</div>
						<div className="pt-2 border-t border-gray-200 text-xs text-gray-400">
							Click to view full details
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SOSList;
