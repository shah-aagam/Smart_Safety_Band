import React from 'react';
import { StatusBadge, SignalBars } from '../utils/UtilityComponent';

const OverviewTab = ({ sos }) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div className="space-y-4">
				<div>
					<label className="text-gray-500 text-sm">Device ID</label>
					<p className="text-gray-900 text-lg font-semibold">{sos.deviceId}</p>
				</div>

				<div>
					<label className="text-gray-500 text-sm">Distress Type</label>
					<p className="text-gray-900 text-lg font-semibold">
						{sos.distressType}
					</p>
				</div>

				<div>
					<label className="text-gray-500 text-sm">Status</label>
					<div className="mt-1">
						<StatusBadge status={sos.status} />
					</div>
				</div>

				<div>
					<label className="text-gray-500 text-sm">Last Update</label>
					<p className="text-gray-900 text-lg">
						{new Date(sos.createdAt).toLocaleString()}
					</p>
				</div>
			</div>

			<div className="space-y-4">
				<div>
					{/* <label className="text-gray-500 text-sm">Network Mode</label> */}
					<p className="text-gray-900 text-lg font-semibold">
						{/* {sos.networkMode} */}
					</p>
				</div>

				<div>
					<label className="text-gray-500 text-sm">Signal Strength</label>
					<div className="flex items-center gap-3 mt-1">
						<SignalBars strength={sos.signalStrength} />
						<span className="text-gray-900">{sos.signalStrength} dBm</span>
					</div>
				</div>

				<div>
					<label className="text-gray-500 text-sm">Location Source</label>
					<p className="text-gray-900 text-lg">{sos.location.source}</p>
				</div>

				<div>
					<label className="text-gray-500 text-sm">Location Accuracy</label>
					<p className="text-gray-900 text-lg">±{sos.location.accuracy}m</p>
				</div>
			</div>

			<div className="md:col-span-2">
				<label className="text-gray-500 text-sm">Full Address</label>
				<p className="text-gray-900 text-lg mt-1">{sos.location.address}</p>
			</div>
		</div>
	);
};

export default OverviewTab;
