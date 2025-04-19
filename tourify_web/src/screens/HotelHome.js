import React, { useEffect, useState } from 'react';
import { firestore } from '../firebase/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function HotelHome() {
  const [hotelName, setHotelName] = useState('');
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedHotelName = localStorage.getItem('hotelName');
    const hotelOwnerId = localStorage.getItem('addedBy'); // hotel owner's ID

    if (storedHotelName && hotelOwnerId) {
      setHotelName(storedHotelName);

      const fetchBookings = async () => {
        try {
          const querySnapshot = await getDocs(collection(firestore, 'bookings'));
          const filtered = querySnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((booking) => booking.addedBy === hotelOwnerId);

          setBookings(filtered);
        } catch (error) {
          console.error('Error fetching bookings:', error);
        }
      };

      fetchBookings();
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const bookingRef = doc(firestore, 'bookings', bookingId);
      await updateDoc(bookingRef, { status });

      // Update UI after status change
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status } : booking
        )
      );
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, Hotel Owner</h1>
      <h2>{hotelName}</h2>

      <button
        onClick={handleLogout}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: 'tomato',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>

      <h3 style={{ marginTop: '40px' }}>Bookings for Your Hotel:</h3>
      {bookings.length > 0 ? (
        <ul>
          {bookings.map((booking) => (
            <li key={booking.id} style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
              <strong>Guest:</strong> {booking.userId} <br />
              <strong>Room:</strong> {booking.roomType} <br />
              <strong>Check-in:</strong> {booking.checkInDate} <br />
              <strong>Check-out:</strong> {booking.checkOutDate} <br />
              <strong>Total Price:</strong> ${booking.totalPrice.toFixed(2)} <br />
              <strong>Status:</strong> {booking.status}

              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={() => updateBookingStatus(booking.id, 'accepted')}
                  style={{
                    marginRight: '10px',
                    padding: '5px 10px',
                    backgroundColor: 'green',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  disabled={booking.status === 'accepted'}
                >
                  Accept
                </button>
                <button
                  onClick={() => updateBookingStatus(booking.id, 'rejected')}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  disabled={booking.status === 'rejected'}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No bookings yet.</p>
      )}
    </div>
  );
}

export default HotelHome;
