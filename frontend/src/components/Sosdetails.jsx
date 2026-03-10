import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSOSContext } from '../context/SOSContext';
import { StatusBadge } from '../utils/UtilityComponent';
import OverviewTab from './Overviewtab';
import LiveDataTab from './LiveDataTab';
import MapTab from './MapTab';
import TimelineTab from './TimelineTab';

const SOSDetails = () => {
	const { selectedSOS, updateSOSStatus, addTimelineEvent } = useSOSContext();
	const [activeTab, setActiveTab] = useState('overview');
	const [heartbeatData, setHeartbeatData] = useState([]);

	useEffect(() => {
		if (!selectedSOS) return;

		const initialData = Array.from({ length: 30 }, (_, i) => ({
			time: i,
			bpm: selectedSOS.heartbeat + (Math.random() - 0.5) * 10,
		}));
		setHeartbeatData(initialData);

		const interval = setInterval(() => {
			setHeartbeatData((prev) => {
				const newData = [
					...prev.slice(1),
					{
						time: prev[prev.length - 1].time + 1,
						bpm: selectedSOS.heartbeat + (Math.random() - 0.5) * 10,
					},
				];
				return newData;
			});
		}, 2000);

		return () => clearInterval(interval);
	}, [selectedSOS]);

	if (!selectedSOS) {
		return (
			<div className="flex items-center justify-center h-full text-white/40">
				<div className="text-center">
					<AlertTriangle
						size={64}
						className="mx-auto mb-4 opacity-50"
					/>
					<p>Select an SOS alert to view details</p>
				</div>
			</div>
		);
	}

	const handleAction = (action) => {
		const statusMap = {
			Acknowledge: 'ACTIVE',
			Resolve: 'RESOLVED',
		};

		if (statusMap[action]) {
			updateSOSStatus(selectedSOS.sosId, statusMap[action]);
		}
		addTimelineEvent(selectedSOS.sosId, `${action} action taken by admin`);
	};

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'livedata', label: 'Live Data' },
		{ id: 'map', label: 'Map' },
		{ id: 'timeline', label: 'Timeline' },
	];

	return (
		<div className="p-6">
			{/* Header */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h2 className="text-3xl font-bold text-white mb-2">
							{selectedSOS.userName}
						</h2>
						<p className="text-white/60">SOS ID: {selectedSOS.sosId}</p>
					</div>
					<StatusBadge status={selectedSOS.status} />
				</div>

				{/* Action Buttons */}
				<div className="flex gap-3">
					<button
						onClick={() => handleAction('Acknowledge')}
						className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded-lg transition-all">
						Acknowledge
					</button>
					<button
						onClick={() => handleAction('Escalate')}
						className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 rounded-lg transition-all">
						Escalate
					</button>
					<button
						onClick={() => handleAction('Resolve')}
						className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 rounded-lg transition-all">
						Resolve
					</button>
				</div>
			</div>

			{/* Tabs */}
			<div className="border-b border-white/10 mb-6">
				<div className="flex gap-6">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`
                pb-3 px-2 font-semibold transition-all
                ${
									activeTab === tab.id
										? 'text-white border-b-2 border-blue-500'
										: 'text-white/40 hover:text-white/60'
								}
              `}>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Tab Content */}
			<div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
				{activeTab === 'overview' && <OverviewTab sos={selectedSOS} />}
				{activeTab === 'livedata' && (
					<LiveDataTab
						sos={selectedSOS}
						heartbeatData={heartbeatData}
					/>
				)}
				{activeTab === 'map' && <MapTab sos={selectedSOS} />}
				{activeTab === 'timeline' && <TimelineTab sos={selectedSOS} />}
			</div>
		</div>
	);
};

export default SOSDetails;
