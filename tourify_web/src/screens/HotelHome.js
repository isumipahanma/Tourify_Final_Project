import React, { useEffect, useState } from 'react';
import { firestore } from '../firebase/firebase';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function HotelHome() {
  const [hotelName, setHotelName] = useState('');
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedHotelName = localStorage.getItem('hotelName');
    const hotelOwnerId = localStorage.getItem('addedBy');

    if (storedHotelName && hotelOwnerId) {
      setHotelName(storedHotelName);

      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        where('addedBy', '==', hotelOwnerId),
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(bookingsQuery, async (snapshot) => {
        try {
          const filtered = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

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
          console.error('Error processing bookings:', error);
        }
      }, (error) => {
        console.error('Error in snapshot listener:', error);
      });

      return () => unsubscribe();
    }
  }, []);

  const sendNotification = async (booking, type, status) => {
    try {
      const message =
        type === 'booking_accepted'
          ? `Your booking is accepted by ${booking.hotelName || hotelName} for ${booking.roomType} from ${booking.checkInDate} to ${booking.checkOutDate}.`
          : `Your booking has been rejected by ${booking.hotelName || hotelName} for ${booking.roomType} from ${booking.checkInDate} to ${booking.checkOutDate}.`;

      await addDoc(collection(firestore, 'notifications'), {
        userId: booking.userId,
        type,
        title: `Booking ${status}`,
        message,
        bookingDetails: {
          hotelName: booking.hotelName || hotelName,
          roomType: booking.roomType,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
        },
        bookingId: booking.id,
        read: false,
        createdAt: serverTimestamp(),
      });
      console.log('Notification sent:', { userId: booking.userId, type, message });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleAcceptClick = (booking) => {
    setSelectedBooking(booking);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(firestore, 'bookings', selectedBooking.id), {
        status: 'accepted',
      });
      await sendNotification(selectedBooking, 'booking_accepted', 'Accepted');
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleReject = async (bookingId) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      await updateDoc(doc(firestore, 'bookings', bookingId), {
        status: 'rejected',
      });
      await sendNotification(booking, 'booking_rejected', 'Rejected');
    } catch (error) {
      console.error('Error rejecting booking:', error);
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

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => navigate('/accepted-bookings')}
          style={{
            marginRight: '10px',
            padding: '10px 20px',
            backgroundColor: 'blue',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          View Accepted Bookings
        </button>
        <button
          onClick={() => navigate('/rejected-bookings')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'purple',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          View Rejected Bookings
        </button>
      </div>

      <h3 style={{ marginTop: '40px', fontWeight: 'bold', color: '#333' }}>
        Pending Bookings for Your Hotel:
      </h3>
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
              <strong>Status:</strong> {booking.status}

              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={() => handleAcceptClick(booking)}
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
                  onClick={() => handleReject(booking.id)}
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
        <p>No pending bookings available. Check the Accepted or Rejected Bookings pages for other statuses.</p>
      )}

      {selectedBooking && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <form
            onSubmit={handleFormSubmit}
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              width: '400px',
            }}
          >
            <h3>Confirm Booking</h3>
            <label>
              Name: <input type="text" value={selectedBooking.username} disabled />
            </label>
            <br />
            <br />
            <label>
              Room Type:{' '}
              <input type="text" value={selectedBooking.roomType} disabled />
            </label>
            <br />
            <br />
            <label>
              Check-in:{' '}
              <input type="text" value={selectedBooking.checkInDate} disabled />
            </label>
            <br />
            <br />
            <label>
              Check-out:{' '}
              <input type="text" value={selectedBooking.checkOutDate} disabled />
            </label>
            <br />
            <br />
            <label>
              Contact:{' '}
              <input type="text" value={selectedBooking.contact} disabled />
            </label>
            <br />
            <br />
            <label>
              Guests:{' '}
              <input type="text" value={selectedBooking.guests || ''} disabled />
            </label>
            <br />
            <br />

            <button
              type="submit"
              style={{ padding: '8px 16px', backgroundColor: 'green', color: '#fff' }}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              style={{ padding: '8px 16px', marginLeft: '10px' }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default HotelHome;