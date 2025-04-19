import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './screens/Login';
import HotelHome from './screens/HotelHome';
import TransportHome from './screens/TransportHome';


function App() {
  return (
    
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/hotelhome" element={<HotelHome />} />
      <Route path="/transporthome" element={<TransportHome />} />
       
      </Routes>
    </Router>
    
  );
}

export default App;