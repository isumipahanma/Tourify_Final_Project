import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './screens/Login';
import HotelHome from './screens/HotelHome';
import TransportHome from './screens/TransportHome';
import AcceptedBookings from './screens/AcceptedBookings';
import RejectedBookings from './screens/RejectedBookings';


function App() {
  return (
    
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/hotelhome" element={<HotelHome />} />
      <Route path="/transporthome" element={<TransportHome />} />
      <Route path="/accepted-bookings" element={<AcceptedBookings />} />
        <Route path="/rejected-bookings" element={<RejectedBookings />} />
      
       
      </Routes>
    </Router>
    
  );
}

export default App;