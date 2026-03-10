import React, { useState, useEffect } from 'react';
import { Clock, Menu } from 'lucide-react';

const Header = ({ setIsMobileOpen }) => {
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		const interval = setInterval(() => {
			setNow(new Date());
		}, 1000); // update every second like a real clock

		return () => clearInterval(interval);
	}, []);

	return (
		<header className="bg-white border-b border-gray-200 px-6 py-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<button
						onClick={() => setIsMobileOpen(true)}
						className="lg:hidden text-gray-500 hover:text-gray-700">
						<Menu size={24} />
					</button>

					<h2 className="text-xl font-semibold text-gray-900">
						Emergency Monitoring
					</h2>
				</div>

				<div className="flex items-center gap-3 text-gray-500">
					<Clock size={18} />
					<span className="text-sm">{now.toLocaleString('en-GB')}</span>
				</div>
			</div>
		</header>
	);
};

export default Header;
