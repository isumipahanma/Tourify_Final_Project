import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import TopDestinations from './TopDestination'; // Assuming this is in the same folder
import { firestore } from '../../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

function Home() {
  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const navigation = useNavigation();

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Fetch all destinations
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const placesRef = collection(firestore, 'places');
        const querySnapshot = await getDocs(placesRef);
        
        const destinationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setDestinations(destinationsList);
        setFilteredDestinations(destinationsList);
      } catch (err) {
        console.error('Error fetching destinations:', err);
        setError('Failed to load destinations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  // Filter destinations based on search query
  useEffect(() => {
    if (searchItemQuery.trim() === '') {
      setFilteredDestinations(destinations);
    } else {
      const lowercasedQuery = searchItemQuery.toLowerCase();
      const filtered = destinations.filter(destination => {
        const nameMatch = destination.placeName && 
          destination.placeName.toLowerCase().includes(lowercasedQuery);
        const districtMatch = destination.district && 
          destination.district.toLowerCase().includes(lowercasedQuery);
        return nameMatch || districtMatch;
      });
      setFilteredDestinations(filtered);
    }
  }, [searchItemQuery, destinations]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.text}>Destinations</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or district..."
          placeholderTextColor="#666"
          value={searchItemQuery}
          onChangeText={setSearchItemQuery}
          autoCapitalize="none"
        />
        <Icon name="search" size={15} color="#666" style={styles.searchIcon} />
      </View>
      {searchItemQuery.trim() === '' && !keyboardVisible && (
        <Text style={styles.text2}>Discover a unique travel experience</Text>
      )}
    </View>
  );

  const renderDestinationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.destinationItem}
      onPress={() => navigation.navigate('DestinationDetail', { destination: item })}
    >
      <View style={styles.destinationContent}>
        {item.imageUrls && item.imageUrls.length > 0 ? (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.imageUrls[0] }} 
              style={styles.destinationImage} 
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={[styles.imageContainer, styles.placeholderImage]}>
            <Icon name="map-marker" size={24} color="#ccc" />
          </View>
        )}
        <View style={styles.destinationInfo}>
          <Text style={styles.destinationName}>{item.placeName}</Text>
          {item.district && (
            <View style={styles.locationContainer}>
              <Icon name="map-marker" size={12} color="#666" style={styles.locationIcon} />
              <Text style={styles.destinationLocation}>{item.district}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSearchResults = () => {
    if (loading) return <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;

    if (searchItemQuery.trim() !== '' && filteredDestinations.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Icon name="exclamation-circle" size={40} color="#ccc" />
          <Text style={styles.noResultsText}>No destinations found matching "{searchItemQuery}"</Text>
          <Text style={styles.noResultsSubtext}>Try searching for a different name or district</Text>
        </View>
      );
    }

    return searchItemQuery.trim() !== '' ? (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsCount}>
          {filteredDestinations.length} {filteredDestinations.length === 1 ? 'result' : 'results'} found
        </Text>
        <FlatList
          data={filteredDestinations}
          keyExtractor={(item) => item.id}
          renderItem={renderDestinationItem}
          contentContainerStyle={[styles.searchResultsContainer, { paddingBottom: keyboardVisible ? 120 : 80 }]}
          showsVerticalScrollIndicator={false}
        />
      </View>
    ) : null;
  };

  const topDestinations = destinations.filter(dest => dest.topDestination === true);

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {renderHeader()}
      {renderSearchResults()}
      {searchItemQuery.trim() === '' && !keyboardVisible && <TopDestinations destinations={topDestinations} />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 30,
  },
  text2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    marginTop: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  searchIcon: {
    marginLeft: 10,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  destinationItem: {
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  destinationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
    overflow: 'hidden',
  },
  destinationImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  destinationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  destinationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 5,
  },
  destinationLocation: {
    fontSize: 14,
    color: '#666',
  },
});

export default Home;