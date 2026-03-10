import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useSOSContext } from '../context/SOSContext';
import { StatusBadge } from '../utils/UtilityComponent';
import OverviewTab from '../components/Overviewtab';
import LiveDataTab from '../components/LiveDataTab';
import MapTab from '../components/MapTab';
import TimelineTab from '../components/TimelineTab';

const UserPage = () => {
	const { sosList, updateSOS } = useSOSContext();
	const { sosId } = useParams();
// console.log(sosId)
	const [activeTab, setActiveTab] = useState('overview');
	const [heartbeatData, setHeartbeatData] = useState([]);

	const sos = sosList?.find((s) => s.sosId === sosId);
	// useEffect(() => {
	// 	console.log('STATUS:', sos?.status);
	// }, [sos?.status]);
	useEffect(() => {
		if (!sos) return;
	}, [sos]);

	if (!sos) {
		return (
			<div className="flex items-center justify-center h-full text-gray-900 bg-gray-50">
				<div className="text-center">
					<AlertTriangle
						size={64}
						className="mx-auto mb-4 opacity-40"
					/>
					<p>SOS not found</p>
				</div>
			</div>
		);
	}

	const handleAction = (action) => {
		const statusMap = {
			Acknowledge: 'ACTIVE',
			Escalate: 'ACTIVE',
			Resolve: 'RESOLVED',
		};
		console.log(sos.sosId, statusMap[action]);
		updateSOS(sos.sosId, {
			status: statusMap[action],
			timelineEvent: `${action} action taken by admin`,
		});
	};

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'livedata', label: 'Live Data' },
		{ id: 'map', label: 'Map' },
		{ id: 'timeline', label: 'Timeline' },
	];

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			{/* Header */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h2 className="text-3xl font-bold text-gray-900 mb-1">
							{sos.userName}
						</h2>
						<p className="text-gray-500">SOS ID: {sos.sosId}</p>
					</div>
					<StatusBadge status={sos.status} />
				</div>

				{/* Actions */}
				<div className="flex gap-3">
					<button
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
						onClick={() => handleAction('Acknowledge')}>
						Acknowledge
					</button>
					<button
						className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
						onClick={() => handleAction('Escalate')}>
						Escalate
					</button>
					<button
						className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
						onClick={() => handleAction('Resolve')}>
						Resolve
					</button>
				</div>
			</div>

			{/* Tabs */}
			<div className="border-b border-gray-200 mb-6">
				<div className="flex gap-6">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`pb-3 px-2 font-semibold transition-colors ${
								activeTab === tab.id
									? 'text-blue-600 border-b-2 border-blue-600'
									: 'text-gray-500 hover:text-gray-900'
							}`}>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Content */}
			<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
				{activeTab === 'overview' && <OverviewTab sos={sos} />}
				{activeTab === 'livedata' && (
					<LiveDataTab
						sos={sos}
						heartbeatData={heartbeatData}
					/>
				)}
				{activeTab === 'map' && <MapTab sos={sos} />}
				{activeTab === 'timeline' && <TimelineTab sos={sos} />}
			</div>
		</div>
	);
};

export default UserPage;
