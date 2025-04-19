import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Alert, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import 'react-native-get-random-values';
import { RadioButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';

const GOOGLE_API_KEY = 'AIzaSyB4Nm99rBDcpjDkapSc8Z51zJZ5bOU7PI0'; // Replace with your real API key

export default function MapScreen() {
  const mapRef = useRef(null);
  const [marker, setMarker] = useState(null);
  const [directions, setDirections] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [travelMode, setTravelMode] = useState('walking'); // Default mode
  const [info, setInfo] = useState(null); // To show distance & duration

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need permission to access your location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    };

    getLocation();
  }, []);

  const getDirections = async (destinationLat, destinationLng, mode = travelMode) => {
    if (!userLocation) return;

    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${destinationLat},${destinationLng}`;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${mode}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const points = data.routes[0].legs[0].steps.map((step) => {
          return {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng,
          };
        });

        setDirections(points);

        // Set distance and duration info
        const leg = data.routes[0].legs[0];
        setInfo({
          distance: leg.distance.text,
          duration: leg.duration.text,
        });
      } else {
        Alert.alert('Error', 'Could not fetch directions');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while fetching directions');
    }
  };

  const handleTravelModeChange = (newMode) => {
    setTravelMode(newMode);
    if (marker) {
      getDirections(marker.latitude, marker.longitude, newMode);
    }
  };

  return (
    <View style={styles.container}>
      {/* Google Places Search Bar */}
      <GooglePlacesAutocomplete
        placeholder="Search by name or district..."
        fetchDetails={true}
        onPress={(data, details = null) => {
          if (details && mapRef.current) {
            const lat = details.geometry.location.lat;
            const lng = details.geometry.location.lng;

            mapRef.current.animateToRegion({
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });

            setMarker({
              latitude: lat,
              longitude: lng,
              title: data.description,
            });

            getDirections(lat, lng);
          }
        }}
        onFail={(error) => console.log('GooglePlacesAutocomplete error:', error)}
        query={{
          key: GOOGLE_API_KEY,
          language: 'en',
        }}
        renderRightButton={() => (
          <View style={styles.searchIconContainer}>
            <Icon name="search" size={20} color="gray" />
          </View>
        )}
        styles={{
          container: {
            position: 'absolute',
            top: 40,
            left: 15,
            right: 15,
            zIndex: 9999,
          },
          textInput: {
            height: 45,
            borderRadius: 10,
            backgroundColor: 'white',
            fontSize: 16,
            paddingRight: 40, // Make space for the search icon
          },
          listView: {
            backgroundColor: 'white',
          },
        }}
      />

      {/* Travel Mode Selector */}
      <View style={styles.radioContainer}>
        <RadioButton.Group onValueChange={handleTravelModeChange} value={travelMode}>
          <View style={styles.iconRadioColumn}>
            <View style={styles.iconRadioItem}>
              <MaterialCommunityIcons name="walk" size={24} />
              <RadioButton.Android value="walking" />
            </View>

            <View style={styles.iconRadioItem}>
              <MaterialCommunityIcons name="car" size={24} />
              <RadioButton.Android value="driving" />
            </View>

            <View style={styles.iconRadioItem}>
              <MaterialCommunityIcons name="bike" size={24} />
              <RadioButton.Android value="bicycling" />
            </View>

            <View style={styles.iconRadioItem}>
              <MaterialCommunityIcons name="bus" size={24} />
              <RadioButton.Android value="transit" />
            </View>
          </View>
        </RadioButton.Group>
      </View>

      {/* Show Distance and Duration */}
      {info && (
        <View style={styles.infoBox}>
          <Text>Distance: {info.distance}</Text>
          <Text>Estimated Time: {info.duration}</Text>
        </View>
      )}

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {marker && (
          <Marker
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
          />
        )}

        {directions && (
          <Polyline
            coordinates={directions}
            strokeColor="blue"
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    width: '100%',
    zIndex: 10, // lower than listView
  },
  searchIconContainer: {
    position: 'absolute',
    right: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listView: {
    backgroundColor: 'white',
    zIndex: 20, // ensures dropdown is above radio buttons
    elevation: 5, // for Android shadow
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  radioContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    zIndex: 9999,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoBox: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    zIndex: 9999,
    alignSelf: 'flex-start',
    right: 50,
  },
  iconRadioColumn: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  iconRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
});