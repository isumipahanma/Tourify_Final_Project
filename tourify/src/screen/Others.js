import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TextInput, 
  Modal, 
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from 'react-native-vector-icons';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { auth, firestore } from '../../firebase/firebase';

const Others = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState({ code: 'USD', name: 'US Dollar', symbol: '$' });
  const [toCurrency, setToCurrency] = useState({ code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' });
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectingFrom, setSelectingFrom] = useState(true);
  
  // Exchange rates
  const [exchangeRates, setExchangeRates] = useState({});
  const [lastUpdated, setLastUpdated] = useState('');
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [rateError, setRateError] = useState(null);
  
  // Rating and comment states
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  ];

  // Fetch exchange rates from API
  const fetchExchangeRates = async () => {
    setIsLoadingRates(true);
    setRateError(null);
    
    try {
      // Using ExchangeRate-API (free tier) - in a real app, you would use your own API key
      // Free tier allows USD as base currency only
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      
      if (data && data.rates) {
        setExchangeRates(data.rates);
        // Format the timestamp to a readable date/time
        const date = new Date(data.time_last_update_unix * 1000);
        setLastUpdated(date.toLocaleString());
      } else {
        throw new Error('Invalid data format from API');
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      setRateError('Could not load exchange rates. Using fallback rates.');
      // Fallback rates in case API fails
      setExchangeRates({
        USD: 1.00, EUR: 0.85, GBP: 0.72, AUD: 1.34, JPY: 109.25,
        INR: 74.50, CNY: 6.45, SGD: 1.35, LKR: 275.50, CAD: 1.25,
        AED: 3.67, THB: 31.50
      });
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Fetch reviews from Firestore
  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const reviewsRef = collection(firestore, 'appReviews');
      const q = query(reviewsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const reviewsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviewsData.push({
          id: doc.id,
          username: data.username,
          rating: data.rating,
          comment: data.comment,
          date: data.createdAt.toDate().toISOString().split('T')[0]
        });
      });
      
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Error', 'Failed to load reviews. Please try again later.');
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Refresh rates manually
  const refreshRates = () => {
    fetchExchangeRates();
    Alert.alert('Refreshing', 'Getting the latest exchange rates...');
  };

  const convertCurrency = () => {
    if (amount && !isNaN(amount) && Object.keys(exchangeRates).length > 0) {
      // Using USD as the base (since our API provides rates relative to USD)
      const fromRate = exchangeRates[fromCurrency.code] || 1;
      const toRate = exchangeRates[toCurrency.code] || 1;
      
      // First convert to USD, then to target currency
      const amountInUSD = parseFloat(amount) / fromRate;
      const result = amountInUSD * toRate;
      
      setConvertedAmount(result.toFixed(2));
    } else {
      setConvertedAmount(null);
    }
  };

  // Calculate the exchange rate between the two selected currencies
  const getExchangeRate = () => {
    if (Object.keys(exchangeRates).length === 0) return '...';
    
    const fromRate = exchangeRates[fromCurrency.code] || 1;
    const toRate = exchangeRates[toCurrency.code] || 1;
    return (toRate / fromRate).toFixed(4);
  };

  // Swap the from and to currencies
  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  // Handle rating submission
  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    try {
      // Get current user information
      const user = auth.currentUser;
      let username = 'Anonymous User';
      
      if (user) {
        // If user is signed in, use their display name or email
        username = user.displayName || user.email || 'User';
      }

      // Create the review object
      const reviewData = {
        username: username,
        rating: rating,
        comment: comment.trim(),
        createdAt: Timestamp.now(),
        userId: user ? user.uid : null
      };

      // Add to Firestore
      const reviewsRef = collection(firestore, 'appReviews');
      await addDoc(reviewsRef, reviewData);

      // Clear form and close modal
      setRatingModalVisible(false);
      setRating(0);
      setComment('');

      // Refresh reviews list
      fetchReviews();

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit your review. Please try again.');
    }
  };

  // Render star rating
  const renderStars = (count, selectable = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={selectable ? () => setRating(i) : null}
          disabled={!selectable}
          style={selectable ? { padding: 5 } : {}}
        >
          <Ionicons
            name={i <= count ? "star" : "star-outline"}
            size={selectable ? 36 : 16}
            color={i <= count ? "#FFD700" : "#aaa"}
          />
        </TouchableOpacity>
      );
    }
    return (
      <View style={{ flexDirection: 'row' }}>
        {stars}
      </View>
    );
  };

  // Fetch exchange rates and reviews on component mount
  useEffect(() => {
    fetchExchangeRates();
    fetchReviews();
    
    // Optional: Set up a timer to refresh rates periodically (e.g., every hour)
    const refreshInterval = setInterval(() => {
      fetchExchangeRates();
    }, 3600000); // 1 hour
    
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (amount) {
      convertCurrency();
    }
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  const openCurrencyModal = (isFrom) => {
    setSelectingFrom(isFrom);
    setModalVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore More</Text>
        <Text style={styles.headerSubtitle}>Find amazing places & restaurants</Text>
      </View>

      {/* Currency Converter */}
      <View style={styles.converterContainer}>
        <View style={styles.converterHeader}>
          <Text style={styles.sectionTitle}>Currency Converter</Text>
          <View style={styles.headerButtonsContainer}>
            <TouchableOpacity onPress={swapCurrencies} style={styles.headerButton}>
              <Ionicons name="swap-horizontal" size={20} color="#007bff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={refreshRates} style={styles.headerButton}>
              <Ionicons name="refresh" size={20} color="#007bff" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.converterSubtitle}>
          Convert between different currencies
          {lastUpdated ? ` • Updated: ${lastUpdated}` : ''}
        </Text>
        
        {isLoadingRates ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading latest rates...</Text>
          </View>
        ) : rateError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{rateError}</Text>
          </View>
        ) : (
          <>
            <View style={styles.converterRow}>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              
              <TouchableOpacity 
                style={styles.currencySelector}
                onPress={() => openCurrencyModal(true)}
              >
                <Text style={styles.currencyText}>{fromCurrency.code}</Text>
                <Ionicons name="chevron-down" size={16} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.converterRow}>
              <View style={[styles.amountInput, styles.resultInput]}>
                <Text style={styles.resultText}>
                  {convertedAmount ? convertedAmount : '0.00'}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.currencySelector}
                onPress={() => openCurrencyModal(false)}
              >
                <Text style={styles.currencyText}>{toCurrency.code}</Text>
                <Ionicons name="chevron-down" size={16} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.rateContainer}>
              <Text style={styles.rateInfo}>
                {`1 ${fromCurrency.code} = ${getExchangeRate()} ${toCurrency.code}`}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Options Section */}
      <View style={styles.optionsContainer}>
        {/* Explore Restaurants */}
        <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('AddRestaurantScreen')}>
          <Ionicons name="restaurant-outline" size={30} color="#007bff" />
          <Text style={styles.optionText}>Add a Restaurant</Text>
        </TouchableOpacity>
        
        {/* Explore Hotels */}
        <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('AddHotelScreen')}>
          <Ionicons name="bed-outline" size={30} color="#007bff" />
          <Text style={styles.optionText}>Add a Hotel</Text>
        </TouchableOpacity>
        
        {/* Find Local Guides */}
        <TouchableOpacity style={styles.optionCard}>
          <Ionicons name="map-outline" size={30} color="#007bff" />
          <Text style={styles.optionText}>Find Local Guides</Text>
        </TouchableOpacity>
        
        {/* View Profile */}
        <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={30} color="#007bff" />
          <Text style={styles.optionText}>View Profile</Text>
        </TouchableOpacity>
        
        {/* View Notifications */}
        <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={30} color="#007bff" />
          <Text style={styles.optionText}>Notifications</Text>
        </TouchableOpacity>
      </View>
      
      {/* Featured Places */}
      <Text style={styles.sectionTitle}>Featured Destinations</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
        <Image source={{ uri: 'https://source.unsplash.com/300x200/?beach' }} style={styles.destinationImage} />
        <Image source={{ uri: 'https://source.unsplash.com/300x200/?city' }} style={styles.destinationImage} />
        <Image source={{ uri: 'https://source.unsplash.com/300x200/?mountain' }} style={styles.destinationImage} />
      </ScrollView>
      
      {/* Ratings & Reviews Section */}
      <View style={styles.ratingsSection}>
        <View style={styles.ratingsHeader}>
          <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
          <TouchableOpacity 


            style={styles.rateButton}
            onPress={() => setRatingModalVisible(true)}
          >
            <Text style={styles.rateButtonText}>Rate App</Text>
          </TouchableOpacity>
        </View>
        
        {/* Reviews List */}
        {isLoadingReviews ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#007bff" />
            <Text style={styles.loadingText}>Loading reviews...</Text>
          </View>
        ) : reviews.length > 0 ? (
          reviews.map(review => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUsername}>{review.username}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <View style={styles.reviewRating}>
                {renderStars(review.rating)}
              </View>
              {review.comment ? (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.noReviews}>No reviews yet. Be the first to rate!</Text>
        )}
      </View>

      {/* Currency Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {selectingFrom ? "From" : "To"} Currency
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={currencies}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.currencyItem}
                  onPress={() => {
                    if (selectingFrom) {
                      setFromCurrency(item);
                    } else {
                      setToCurrency(item);
                    }
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.currencyItemCode}>{item.code}</Text>
                  <Text style={styles.currencyItemName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={ratingModalVisible}
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Our App</Text>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.ratingModalContent}>
              <Text style={styles.ratingLabel}>How would you rate your experience?</Text>
              
              <View style={styles.starsContainer}>
                {renderStars(rating, true)}
              </View>
              
              <TextInput
                style={styles.commentInput}
                placeholder="Share your thoughts (optional)"
                multiline={true}
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
              />
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={submitRating}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#f1f1f1',
  },
  converterContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  converterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 5,
    marginLeft: 0,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 5,
  },
  converterSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'tomato',
    textAlign: 'center',
  },
  converterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountInput: {
    flex: 2,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 16,
  },
  resultInput: {
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  resultText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  currencySelector: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  rateContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  rateInfo: {
    fontSize: 14,
    color: '#666',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    flexWrap: 'wrap',
  },
  optionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: 100,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 20,
  },
  scrollContainer: {
    marginTop: 10,
    paddingLeft: 20,
    marginBottom: 20,
  },
  destinationImage: {
    width: 150,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  // Ratings & Reviews Styles
  ratingsSection: {
    marginVertical: 20,
    paddingBottom: 30,
  },
  ratingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    marginBottom: 10,
  },
  rateButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  rateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewUsername: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
  },
  reviewRating: {
    marginBottom: 8,
  },
  reviewComment: {
    color: '#444',
    fontSize: 14,
    lineHeight: 20,
  },
  noReviews: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontStyle: 'italic',
  },
  // Modals
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  currencyItemCode: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 50,
  },
  currencyItemName: {
    fontSize: 16,
    color: '#444',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
  // Rating Modal Styles
  ratingModalContent: {
    padding: 20,
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#444',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Others;