import React from 'react';
import { AlertTriangle, Activity, CheckCircle, Clock } from 'lucide-react';

const TimelineTab = ({ sos }) => {
	const getEventIcon = (type) => {
		switch (type) {
			case 'critical':
				return (
					<AlertTriangle
						className="text-red-500"
						size={18}
					/>
				);
			case 'warning':
				return (
					<Activity
						className="text-yellow-500"
						size={18}
					/>
				);
			case 'success':
				return (
					<CheckCircle
						className="text-green-600"
						size={18}
					/>
				);
			default:
				return (
					<Clock
						className="text-blue-500"
						size={18}
					/>
				);
		}
	};

	return (
		<div className="space-y-4">
			{sos.timeline.map((event, index) => (
				<div
					key={index}
					className="flex gap-4">
					{/* Timeline indicator */}
					<div className="flex flex-col items-center">
						<div className="bg-gray-100 p-2 rounded-full">
							{getEventIcon(event.type)}
						</div>

						{index < sos.timeline.length - 1 && (
							<div className="w-0.5 h-full bg-gray-200 mt-2" />
						)}
					</div>

					{/* Event content */}
					<div className="flex-1 pb-6">
						<div className="flex items-center justify-between mb-1">
							<h4 className="text-gray-900 font-semibold">{event.event}</h4>
							<span className="text-gray-500 text-sm">{event.time}</span>
						</div>

						<p className="text-gray-400 text-sm">
							{event.type === 'critical'
								? 'Emergency alert triggered'
								: event.type === 'warning'
								? 'System detected abnormal status'
								: event.type === 'success'
								? 'Issue resolved successfully'
								: 'System update'}
						</p>
					</div>
				</div>
			))}
		</div>
	);
};

export default TimelineTab;
