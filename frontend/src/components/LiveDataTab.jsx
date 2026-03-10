import React from 'react';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';

const LiveDataTab = ({ sos, heartbeatData }) => {
	const currentBPM =
		heartbeatData.length > 0
			? heartbeatData[heartbeatData.length - 1].bpm
			: sos.heartbeat;

	const statusColor =
		sos.heartbeatStatus === 'HIGH'
			? 'text-red-500'
			: sos.heartbeatStatus === 'LOW'
			? 'text-yellow-500'
			: 'text-green-600';

	const statusLabel =
		sos.heartbeatStatus === 'HIGH'
			? 'Elevated Heart Rate'
			: sos.heartbeatStatus === 'LOW'
			? 'Low Heart Rate'
			: 'Normal Heart Rate';

	const lineColor =
		sos.heartbeatStatus === 'HIGH'
			? '#ef4444'
			: sos.heartbeatStatus === 'LOW'
			? '#f59e0b'
			: '#22c55e';

	return (
		<div className="space-y-6">
			{/* Current BPM */}
			<div className="text-center">
				<p className="text-gray-500 text-sm mb-2">Current Heartbeat</p>

				<div className={`text-7xl font-bold ${statusColor}`}>
					{Math.round(currentBPM)}
				</div>

				<p className="text-gray-500 text-lg mt-1">BPM</p>

				<p className={`mt-3 text-lg font-semibold ${statusColor}`}>
					{statusLabel}
				</p>
			</div>

			{/* Chart */}
			<div className="bg-white border border-gray-200 rounded-lg p-4">
				<h4 className="text-gray-900 font-semibold mb-4">
					Live Heartbeat Monitor
				</h4>

				<ResponsiveContainer
					width="100%"
					height={250}>
					<LineChart data={heartbeatData}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="#e5e7eb"
						/>
						<XAxis
							dataKey="time"
							stroke="#9ca3af"
						/>
						<YAxis
							stroke="#9ca3af"
							domain={[60, 160]}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: '#ffffff',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								color: '#111827',
							}}
						/>
						<Line
							type="monotone"
							dataKey="bpm"
							stroke={lineColor}
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ResponsiveContainer>

				<p className="text-gray-400 text-sm mt-2 text-center">
					Updates every 2 seconds
				</p>
			</div>
		</div>
	);
};

export default LiveDataTab;
