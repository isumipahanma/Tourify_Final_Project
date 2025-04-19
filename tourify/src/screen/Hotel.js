// HotelSearchPage.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { firestore } from '../../firebase/firebase'; // Adjust path as per your project structure
import { collection, query, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

// Hotel class and utilities
class Hotel {
  constructor(data) {
    this.id = data.id || '';
    this.addedBy = data.addedBy || '';
    this.amenities = data.amenities || [];
    this.category = data.category || '';
    this.contactNumber = data.contactNumber || '';
    this.createdAt = data.createdAt || null;
    this.description = data.description || '';
    this.hotelOperatingInfo = data.hotelOperatingInfo || { checkIn: '', checkOut: '' };
    this.imageUrls = data.imageUrls || [];
    this.location = data.location || '';
    this.name = data.name || '';
    this.priceRange = data.priceRange || '';
    this.renovationYear = data.renovationYear || '';
    this.roomTypes = data.roomTypes || [];
    this.starRating = data.starRating || '0';
    this.totalRooms = data.totalRooms || '0';
    this.updatedAt = data.updatedAt || null;
    this.website = data.website || '';
    this.yearBuilt = data.yearBuilt || '';
  }

  static fromFirestore(doc) {
    const data = { id: doc.id, ...doc.data() };
    return new Hotel(data);
  }

  getLowestPrice() {
    if (!this.roomTypes || this.roomTypes.length === 0) return 'N/A';
    const prices = this.roomTypes
      .map(room => parseFloat(room.price))
      .filter(price => !isNaN(price));
    return prices.length > 0 ? Math.min(...prices).toString() : 'N/A';
  }
}

const HotelUtils = {
  filterHotels(hotels, selectedFilter, searchQuery) {
    // First, filter out any 2-star hotels regardless of filter
    let results = hotels.filter(hotel => parseInt(hotel.starRating) >= 3 || hotel.starRating === '');
    
    // If a specific star filter is selected (not "All"), apply it
    if (selectedFilter !== 'all') {
      results = results.filter(hotel => hotel.starRating === selectedFilter);
    }
    
    // Apply search query filter if present
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      results = results.filter(hotel =>
        hotel.name.toLowerCase().includes(lowerCaseQuery) ||
        hotel.location.toLowerCase().includes(lowerCaseQuery)
      );
    }
    
    return results;
  },

  snapshotToHotels(querySnapshot) {
    const hotels = [];
    querySnapshot.forEach(doc => {
      hotels.push(Hotel.fromFirestore(doc));
    });
    return hotels;
  },
};

// HotelSearchPage Component
const HotelSearchPage = ({ navigation }) => {
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Change to use a single selected filter instead of multiple
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const hotelsRef = collection(firestore, 'hotels');
        const q = query(hotelsRef);
        const querySnapshot = await getDocs(q);
        
        const hotelsList = HotelUtils.snapshotToHotels(querySnapshot);
        setHotels(hotelsList);
        setFilteredHotels(hotelsList.filter(hotel => parseInt(hotel.starRating) >= 3 || hotel.starRating === ''));
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch hotels');
        setLoading(false);
        console.error('Error fetching hotels:', err);
      }
    };

    fetchHotels();
  }, []);

  useEffect(() => {
    const results = HotelUtils.filterHotels(hotels, selectedFilter, searchQuery);
    setFilteredHotels(results);
  }, [selectedFilter, searchQuery, hotels]);

  const selectFilter = (filter) => {
    setSelectedFilter(filter);
  };

  const renderHotelItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.hotelCard}
      onPress={() => navigation.navigate('HotelDetail', { hotelId: item.id })}
    >
      <Image 
        source={{ uri: item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : null }} 
        style={styles.hotelImage}
        defaultSource={require('../../assets/placeholder-hotel.jpg')}
      />
      <View style={styles.hotelInfo}>
        <Text style={styles.hotelName}>{item.name}</Text>
        <Text style={styles.hotelLocation}>{item.location}, Sri Lanka</Text>
        <View style={styles.starContainer}>
          {[...Array(parseInt(item.starRating))].map((_, i) => (
            <Ionicons key={i} name="star" size={16} color="#FFD700" />
          ))}
        </View>
        <Text style={styles.hotelPrice}>
          From ${item.priceRange || item.getLowestPrice()} per night
        </Text>
        <Text style={styles.hotelCategory}>{item.category}</Text>
        <View style={styles.amenitiesContainer}>
          {item.amenities && item.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityTag}>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
          {item.amenities && item.amenities.length > 3 && (
            <View style={styles.amenityTag}>
              <Text style={styles.amenityText}>+{item.amenities.length - 3}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setLoading(true)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hotels in Sri Lanka</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hotels by name or location"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter by star rating:</Text>
        <View style={styles.starFilterContainer}>
          {/* Add "All" filter option */}
          <TouchableOpacity
            style={[
              styles.starFilter,
              selectedFilter === 'all' && styles.starFilterActive
            ]}
            onPress={() => selectFilter('all')}
          >
            <Text style={[
              styles.starFilterText,
              selectedFilter === 'all' && styles.starFilterTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {[3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              style={[
                styles.starFilter,
                selectedFilter === star.toString() && styles.starFilterActive
              ]}
              onPress={() => selectFilter(star.toString())}
            >
              <Text style={[
                styles.starFilterText,
                selectedFilter === star.toString() && styles.starFilterTextActive
              ]}>
                {star} Star
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <FlatList
        data={filteredHotels}
        renderItem={renderHotelItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hotels found matching your criteria</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  filterContainer: {
    padding: 10,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  starFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  starFilter: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  starFilterActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  starFilterText: {
    fontSize: 14,
    color: '#333',
  },
  starFilterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 10,
  },
  hotelCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hotelImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  hotelInfo: {
    padding: 15,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  hotelLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  starContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  hotelPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 5,
  },
  hotelCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  amenityTag: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 5,
    marginBottom: 5,
  },
  amenityText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HotelSearchPage;