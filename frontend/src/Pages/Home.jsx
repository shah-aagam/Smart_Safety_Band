import React, { useState } from 'react';
import { SOSProvider } from '../context/SOSContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SOSList from '../components/SOSList';
import { useEffect } from 'react';
import axios from 'axios';
const Home = () => {
	const [activeView, setActiveView] = useState('active');
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	useEffect(() => {
		const getAlerts = async () => {
			// const response = await axios.get('http://localhost:3000/alerts');
			// console.log(response.data);
		};
		getAlerts();
	}, []);
	return (
		<div className="min-h-screen bg-blue-50">
			<div className="flex h-screen overflow-hidden">
				{/* Sidebar */}
				<div className="bg-white border-r border-gray-200">
					<Sidebar
						activeView={activeView}
						setActiveView={setActiveView}
						isMobileOpen={isMobileOpen}
						setIsMobileOpen={setIsMobileOpen}
					/>
				</div>

				{/* Main Content */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Header */}
					<div className="bg-white border-b border-gray-200">
						<Header setIsMobileOpen={setIsMobileOpen} />
					</div>

					{/* Page Content */}
					<main className="flex-1 overflow-y-auto p-6">
						<div className="max-w-7xl mx-auto">
							<SOSList
								filterStatus={
									activeView === 'active'
										? 'ACTIVE'
										: activeView === 'resolved'
											? 'RESOLVED'
											: null
								}
							/>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
};

export default Home;
