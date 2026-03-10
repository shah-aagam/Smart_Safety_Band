import React from 'react';
import { X } from 'lucide-react';
import { useSOSContext } from '../context/SOSContext';

const Sidebar = ({
	activeView,
	setActiveView,
	isMobileOpen,
	setIsMobileOpen,
}) => {
	const { sosList } = useSOSContext();
	const activeCount = sosList.filter((s) => s.status === 'ACTIVE').length;
	const resolvedCount = sosList.filter((s) => s.status === 'RESOLVED').length;

	const menuItems = [
		{ id: 'dashboard', label: 'Dashboard', count: null },
		{ id: 'active', label: 'Active SOS', count: activeCount },
		{ id: 'resolved', label: 'Resolved SOS', count: resolvedCount },
	];

	return (
		<>
			{/* Mobile Overlay */}
			{isMobileOpen && (
				<div
					className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
					onClick={() => setIsMobileOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<div
				className={`
					fixed lg:static inset-y-0 left-0 z-50
					w-64 bg-white border-r border-gray-200
					transform transition-transform duration-300 ease-in-out
					${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
				`}>
				<div className="p-6">
					{/* Logo */}
					<div className="flex items-center justify-between mb-8">
						<h1 className="text-2xl font-bold text-blue-600">SafeGuard</h1>
						<button
							onClick={() => setIsMobileOpen(false)}
							className="lg:hidden text-gray-500 hover:text-gray-700">
							<X size={24} />
						</button>
					</div>

					{/* Navigation */}
					<nav className="space-y-1">
						{menuItems.map((item) => (
							<button
								key={item.id}
								onClick={() => {
									setActiveView(item.id);
									setIsMobileOpen(false);
								}}
								className={`
									w-full text-left px-4 py-3 rounded-lg transition-all
									flex items-center justify-between
									${
										activeView === item.id
											? 'bg-blue-50 text-blue-700 font-semibold'
											: 'text-gray-700 hover:bg-gray-100'
									}
								`}>
								<span>{item.label}</span>

								{item.count !== null && (
									<span
										className={`
											px-2 py-0.5 rounded-full text-xs font-bold
											${
												item.id === 'active'
													? 'bg-red-100 text-red-600'
													: 'bg-blue-100 text-blue-600'
											}
										`}>
										{item.count}
									</span>
								)}
							</button>
						))}
					</nav>
				</div>
			</div>
		</>
	);
};

export default Sidebar;
