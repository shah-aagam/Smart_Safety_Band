import {
	Navigate,
	Routes,
	BrowserRouter as Router,
	Route,
} from 'react-router-dom';
import UserPage from './Pages/UserPage';
// import React from 'react'

import Home from './Pages/Home';
// import SOSDetails from './components/Sosdetails';
const Routers = () => {
	return (

			<Routes>
				<Route
					path={'/user'}
					element={<UserPage />}
				/>
				<Route
					path="/:sosId"
					element={<UserPage />}
				/>
				<Route
					path={'/'}
					element={<Home />}
				/>
			</Routes>

	);
};

export default Routers;
