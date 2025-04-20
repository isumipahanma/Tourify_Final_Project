import React, { useEffect, useState } from 'react';
import { firestore } from '../firebase/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function RejectedBookings() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const hotelOwnerId = localStorage.getItem('addedBy');

    if (hotelOwnerId) {
      const fetchBookings = async () => {
        try {
          const querySnapshot = await getDocs(collection(firestore, 'bookings'));
          const filtered = querySnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter(
              (booking) =>
                booking.addedBy === hotelOwnerId && booking.status === 'rejected'
            );

          const bookingsWithContact = await Promise.all(
            filtered.map(async (booking) => {
              try {
                const userDocRef = doc(firestore, 'users', booking.userId);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                  const userData = userSnap.data();
                  return {
                    ...booking,
                    contact: userData.contact || 'Not available',
                    username: userData.username || 'Unknown',
                  };
                } else {
                  return {
                    ...booking,
                    contact: 'Not available',
                    username: 'Unknown',
                  };
                }
              } catch (error) {
                console.error('Error fetching user contact:', error);
                return {
                  ...booking,
                  contact: 'Not available',
                  username: 'Unknown',
                };
              }
            })
          );

          setBookings(bookingsWithContact);
        } catch (error) {
          console.error('Error fetching rejected bookings:', error);
        }
      };

      fetchBookings();
    }
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Rejected Bookings</h1>
      <button
        onClick={() => navigate('/hotelhome')}
        style={{
          marginBottom: '20px',
          padding: '10px 20px',
          backgroundColor: 'blue',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Back to Home
      </button>

      {bookings.length > 0 ? (
        <ul>
          {bookings.map((booking) => (
            <li
              key={booking.id}
              style={{
                marginBottom: '20px',
                borderBottom: '1px solid #ccc',
                paddingBottom: '10px',
              }}
            >
              <strong>Guest:</strong> {booking.username} <br />
              <strong>Room:</strong> {booking.roomType} <br />
              <strong>Total Price:</strong> ${booking.totalPrice.toFixed(2)} <br />
              <strong>Check-in:</strong> {booking.checkInDate} <br />
              <strong>Check-out:</strong> {booking.checkOutDate} <br />
              <strong>Contact:</strong> {booking.contact} <br />
              <strong>Status:</strong> {booking.status}
            </li>
          ))}
        </ul>
      ) : (
        <p>No rejected bookings.</p>
      )}
    </div>
  );
}

export default RejectedBookings;