import React, { useState } from 'react';
import { getAuth,signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { IoMailOutline, IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import '../css/Login.css';

// ✅ Import initialized auth and firestore
import { firestore } from '../firebase/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Both fields are required!');
      return;
    }
  
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      const userDocRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
  
      if (!userSnap.exists()) {
        alert('User data not found!');
        return;
      }
  
      const userData = userSnap.data();
      const purpose = userData.purpose;
  
      // Store purpose in localStorage
      localStorage.setItem('purpose', purpose);
  
      if (purpose === 'hotel owner') {
        // Fetch hotel info added by this user
        const hotelQuery = query(
          collection(firestore, 'hotels'),
          where('addedBy', '==', user.uid)
        );
        const hotelSnapshot = await getDocs(hotelQuery);
  
        if (!hotelSnapshot.empty) {
          const hotelDoc = hotelSnapshot.docs[0];
          const hotelData = hotelDoc.data();
  
          // Save hotel details in localStorage
          localStorage.setItem('hotelName', hotelData.name);
          localStorage.setItem('hotelId', hotelDoc.id); // Firestore document ID
          localStorage.setItem('addedBy', hotelData.addedBy); // Owner ID
  
          navigate('/Hotelhome');
        } else {
          alert('Hotel information not found.');
        }
      } else if (purpose === 'transport') {
        navigate('/Transporthome');
      } else {
        alert("You don't have access for this.");
      }
    } catch (error) {
      alert(`Login Failed: ${error.message}`);
    }
  };
  


  return (
    <div className="container">
      <div className="form-container">
        <h1 className="title">Welcome Back</h1>
        <div className="input-container">
          <div className="input-wrapper">
            <IoMailOutline className="icon" />
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
            />
          </div>
          <div className="input-wrapper">
            <IoLockClosedOutline className="icon" />
            <input
              className="input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
            </button>
          </div>
        </div>
        <button className="login-button" onClick={handleLogin}>
          Login
        </button>
        <div className="link-container">
          <button
            type="button"
            className="link"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot Password?
          </button>
          <button type="button" className="link" onClick={() => navigate('/register')}>
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
