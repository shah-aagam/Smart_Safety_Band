import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { SOSProvider } from './context/SOSContext.jsx';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
createRoot(document.getElementById('root')).render(
	<StrictMode>
		<BrowserRouter>
			<SOSProvider>
				<LoadScript googleMapsApiKey="AIzaSyD8h9G4cdb_YHW4P-baatBKn3X1ySxSCcI">
					<App />
				</LoadScript>
			</SOSProvider>
		</BrowserRouter>
	</StrictMode>
);
