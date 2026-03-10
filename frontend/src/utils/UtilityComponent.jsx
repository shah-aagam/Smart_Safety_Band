import React from 'react';

export const StatusBadge = ({ status }) => {
	const styles = {
		ACTIVE: 'bg-red-500/20 text-red-300 border-red-500/50',
		RESOLVED: 'bg-green-500/20 text-green-300 border-green-500/50',
		OFFLINE: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
	};

	return (
		<span
			className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
			{status}
		</span>
	);
};

export const SignalBars = ({ strength }) => {
	const bars = strength > -70 ? 4 : strength > -80 ? 3 : strength > -90 ? 2 : 1;
	return (
		<div className="flex gap-0.5 items-end">
			{[...Array(4)].map((_, i) => (
				<div
					key={i}
					className={`w-1 ${i < bars ? 'bg-green-400' : 'bg-gray-600'}`}
					style={{ height: `${(i + 1) * 4}px` }}
				/>
			))}
		</div>
	);
};
