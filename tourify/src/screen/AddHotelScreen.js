import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Switch
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons, FontAwesome5 } from 'react-native-vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../firebase/firebase'; // Adjust path as needed

// Custom Time Picker Component (reused from AddRestaurantScreen)
const CustomTimePicker = ({ visible, onClose, onSelect, initialHour = 14, initialMinute = 0 }) => {
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [amPm, setAmPm] = useState(initialHour >= 12 ? 'PM' : 'AM');

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    // Convert to 24 hour format for internal use
    let hour24 = hour;
    if (amPm === 'PM' && hour !== 12) hour24 = hour + 12;
    if (amPm === 'AM' && hour === 12) hour24 = 0;
    
    const date = new Date();
    date.setHours(hour24);
    date.setMinutes(minute);
    
    onSelect(date);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={timePickerStyles.centeredView}>
        <View style={timePickerStyles.modalView}>
          <Text style={timePickerStyles.modalTitle}>Select Time</Text>
          
          <View style={timePickerStyles.pickerContainer}>
            {/* Hour picker */}
            <View style={timePickerStyles.pickerColumn}>
              <Text style={timePickerStyles.pickerLabel}>Hour</Text>
              <ScrollView 
                style={timePickerStyles.picker}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 80 }}
              >
                {hours.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      timePickerStyles.pickerItem,
                      h === hour && timePickerStyles.selectedItem
                    ]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={h === hour ? timePickerStyles.selectedItemText : timePickerStyles.pickerItemText}>
                      {h < 10 ? `0${h}` : h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Minute picker */}
            <View style={timePickerStyles.pickerColumn}>
              <Text style={timePickerStyles.pickerLabel}>Minute</Text>
              <ScrollView 
                style={timePickerStyles.picker}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 80 }}
              >
                {minutes.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      timePickerStyles.pickerItem,
                      m === minute && timePickerStyles.selectedItem
                    ]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={m === minute ? timePickerStyles.selectedItemText : timePickerStyles.pickerItemText}>
                      {m < 10 ? `0${m}` : m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* AM/PM picker */}
            <View style={timePickerStyles.pickerColumn}>
              <Text style={timePickerStyles.pickerLabel}>AM/PM</Text>
              <View style={timePickerStyles.amPmContainer}>
                <TouchableOpacity
                  style={[
                    timePickerStyles.amPmButton,
                    amPm === 'AM' && timePickerStyles.selectedAmPm
                  ]}
                  onPress={() => setAmPm('AM')}
                >
                  <Text style={amPm === 'AM' ? timePickerStyles.selectedAmPmText : timePickerStyles.amPmText}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    timePickerStyles.amPmButton,
                    amPm === 'PM' && timePickerStyles.selectedAmPm
                  ]}
                  onPress={() => setAmPm('PM')}
                >
                  <Text style={amPm === 'PM' ? timePickerStyles.selectedAmPmText : timePickerStyles.amPmText}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={timePickerStyles.buttonContainer}>
            <TouchableOpacity
              style={[timePickerStyles.button, timePickerStyles.buttonCancel]}
              onPress={onClose}
            >
              <Text style={timePickerStyles.buttonCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[timePickerStyles.button, timePickerStyles.buttonConfirm]}
              onPress={handleConfirm}
            >
              <Text style={timePickerStyles.buttonConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Room Types Component
const RoomTypeItem = ({ index, roomType, onUpdate, onRemove }) => {
  return (
    <View style={styles.roomTypeContainer}>
      <View style={styles.roomTypeHeader}>
        <Text style={styles.roomTypeTitle}>Room Type #{index + 1}</Text>
        <TouchableOpacity onPress={() => onRemove(index)}>
          <Ionicons name="trash-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputWrapper}>
        <Ionicons name="bed-outline" size={22} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Room Type (e.g., Standard, Deluxe, Suite)"
          value={roomType.name}
          onChangeText={(text) => onUpdate(index, { ...roomType, name: text })}
        />
      </View>
      
      <View style={styles.inputWrapper}>
        <MaterialIcons name="people-outline" size={22} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Capacity (e.g., 2, 4 persons)"
          value={roomType.capacity}
          onChangeText={(text) => onUpdate(index, { ...roomType, capacity: text })}
          keyboardType="number-pad"
        />
      </View>
      
      <View style={styles.inputWrapper}>
        <MaterialIcons name="attach-money" size={22} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Price per night"
          value={roomType.price}
          onChangeText={(text) => onUpdate(index, { ...roomType, price: text })}
          keyboardType="decimal-pad"
        />
      </View>
      
      <View style={styles.inputWrapper}>
        <MaterialIcons name="hotel" size={22} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Number of rooms available"
          value={roomType.quantity}
          onChangeText={(text) => onUpdate(index, { ...roomType, quantity: text })}
          keyboardType="number-pad"
        />
      </View>
    </View>
  );
};

const AddHotelScreen = ({ navigation }) => {
  // Basic hotel information
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [images, setImages] = useState([]);
  
  // Check-in/out times
  const [checkInTime, setCheckInTime] = useState(new Date(new Date().setHours(14, 0, 0, 0)));
  const [checkOutTime, setCheckOutTime] = useState(new Date(new Date().setHours(11, 0, 0, 0)));
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  
  // Room information
  const [roomTypes, setRoomTypes] = useState([{
    name: '',
    capacity: '',
    price: '',
    quantity: ''
  }]);
  
  // Amenities
  const [amenities, setAmenities] = useState({
    wifi: false,
    parking: false,
    pool: false,
    gym: false,
    restaurant: false,
    spa: false,
    airConditioning: false,
    roomService: false,
    petFriendly: false,
    conferenceRoom: false
  });
  
  // Star rating
  const [starRating, setStarRating] = useState('');
  
  // Additional information
  const [totalRooms, setTotalRooms] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [renovationYear, setRenovationYear] = useState('');
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const pickImage = async () => {
    if (images.length >= 10) {
      Alert.alert("Limit Reached", "You can only upload up to 10 images");
      return;
    }

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'We need camera roll permissions to upload images.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const addRoomType = () => {
    setRoomTypes([...roomTypes, {
      name: '',
      capacity: '',
      price: '',
      quantity: ''
    }]);
  };

  const updateRoomType = (index, updatedRoom) => {
    const updatedRoomTypes = [...roomTypes];
    updatedRoomTypes[index] = updatedRoom;
    setRoomTypes(updatedRoomTypes);
  };

  const removeRoomType = (index) => {
    if (roomTypes.length === 1) {
      Alert.alert("Cannot Remove", "You must have at least one room type");
      return;
    }
    
    const updatedRoomTypes = [...roomTypes];
    updatedRoomTypes.splice(index, 1);
    setRoomTypes(updatedRoomTypes);
  };

  const toggleAmenity = (amenity) => {
    setAmenities({
      ...amenities,
      [amenity]: !amenities[amenity]
    });
  };

  const uploadImage = async (uri) => {
    const storage = getStorage();
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const storageRef = ref(storage, `hotels/${Date.now()}_${filename}`);

    // Fetch the image and convert to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload blob to Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!name || !description || !location || !category || images.length === 0) {
      Alert.alert('Missing Information', 'Please fill in all required fields and add at least one image');
      return;
    }

    // Validate room types
    const invalidRoomTypes = roomTypes.some(room => 
      !room.name || !room.capacity || !room.price || !room.quantity
    );
    
    if (invalidRoomTypes) {
      Alert.alert('Incomplete Room Information', 'Please fill in all room type details');
      return;
    }

    setIsLoading(true);

    try {
      // Upload images and get URLs
      const imageUrls = await Promise.all(images.map(uri => uploadImage(uri)));

      // Calculate total number of rooms if not manually entered
      let calculatedTotalRooms = totalRooms;
      if (!calculatedTotalRooms) {
        calculatedTotalRooms = roomTypes.reduce((sum, room) => sum + parseInt(room.quantity || 0), 0).toString();
      }

      // Format check-in/out times
      const hotelOperatingInfo = {
        checkIn: formatTime(checkInTime),
        checkOut: formatTime(checkOutTime)
      };

      // Filter active amenities
      const activeAmenities = Object.entries(amenities)
        .filter(([_, value]) => value)
        .map(([key, _]) => key);

      // Create hotel document
      const hotelData = {
        name,
        description,
        location,
        category,
        priceRange,
        contactNumber,
        website,
        imageUrls,
        hotelOperatingInfo,
        roomTypes,
        amenities: activeAmenities,
        starRating,
        totalRooms: calculatedTotalRooms,
        yearBuilt,
        renovationYear,
        addedBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to Firestore
      await addDoc(collection(firestore, 'hotels'), hotelData);

      Alert.alert(
        'Success', 
        'Hotel added successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding hotel:', error);
      Alert.alert('Error', 'Failed to add hotel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New Hotel</Text>
      </View>
      
      {/* Hotel Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Hotel Name *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="business-outline" size={22} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Enter hotel name"
            value={name}
            onChangeText={setName}
          />
        </View>
      </View>

      {/* Description */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description *</Text>
        <View style={[styles.inputWrapper, { height: 120 }]}>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Enter hotel description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      {/* Location */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Location *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="location-outline" size={22} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Enter hotel address"
            value={location}
            onChangeText={setLocation}
          />
        </View>
      </View>

      {/* Category */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category *</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="category" size={22} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="E.g., Business, Resort, Boutique"
            value={category}
            onChangeText={setCategory}
          />
        </View>
      </View>

      {/* Star Rating */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Star Rating</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="star-outline" size={22} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="E.g., 3, 4, 5"
            value={starRating}
            onChangeText={setStarRating}
            keyboardType="number-pad"
            maxLength={1}
          />
        </View>
      </View>

      {/* Price Range */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Price Range</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="attach-money" size={22} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="E.g., Budget, Mid-range, Luxury"
            value={priceRange}
            onChangeText={setPriceRange}
          />
        </View>
      </View>

      {/* Contact Number */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Contact Number</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="call-outline" size={22} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Website */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Website</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="globe-outline" size={22} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Enter website URL"
            value={website}
            onChangeText={setWebsite}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Check-in/out Times */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Check-in/out Times</Text>
        <View style={styles.hoursContainer}>
          <TouchableOpacity 
            style={styles.timeSelector} 
            onPress={() => setShowCheckInPicker(true)}
          >
            <Ionicons name="enter-outline" size={22} color="#666" style={styles.timeIcon} />
            <Text>Check-in: {formatTime(checkInTime)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.timeSelector} 
            onPress={() => setShowCheckOutPicker(true)}
          >
            <Ionicons name="exit-outline" size={22} color="#666" style={styles.timeIcon} />
            <Text>Check-out: {formatTime(checkOutTime)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Total Number of Rooms */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Total Number of Rooms</Text>
        <View style={styles.inputWrapper}>
          <FontAwesome5 name="door-open" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Total rooms in hotel (optional)"
            value={totalRooms}
            onChangeText={setTotalRooms}
            keyboardType="number-pad"
          />
        </View>
        <Text style={styles.hint}>If not provided, will be calculated from room types</Text>
      </View>

      {/* Property Age */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Property Information</Text>
        <View style={styles.rowContainer}>
          <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
            <MaterialIcons name="date-range" size={22} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Year built"
              value={yearBuilt}
              onChangeText={setYearBuilt}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
          
          <View style={[styles.inputWrapper, { flex: 1, marginLeft: 8 }]}>
            <Ionicons name="construct-outline" size={22} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Last renovated"
              value={renovationYear}
              onChangeText={setRenovationYear}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
        </View>
      </View>

      {/* Room Types */}
      <View style={styles.inputContainer}>
        <Text style={styles.sectionTitle}>Room Types *</Text>
        
        {roomTypes.map((roomType, index) => (
          <RoomTypeItem
            key={index}
            index={index}
            roomType={roomType}
            onUpdate={updateRoomType}
            onRemove={removeRoomType}
          />
        ))}
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={addRoomType}
        >
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" style={{ marginRight: 5 }} />
          <Text style={styles.addButtonText}>Add Another Room Type</Text>
        </TouchableOpacity>
      </View>

      {/* Amenities */}
      <View style={styles.inputContainer}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenitiesContainer}>
          <View style={styles.amenityRow}>
            <View style={styles.amenityItem}>
              <Switch
                value={amenities.wifi}
                onValueChange={() => toggleAmenity('wifi')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={amenities.wifi ? '#007AFF' : '#f4f3f4'}
              />
              <Text style={styles.amenityLabel}>WiFi</Text>
            </View>
            
            <View style={styles.amenityItem}>
              <Switch
                value={amenities.parking}
                onValueChange={() => toggleAmenity('parking')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={amenities.parking ? '#007AFF' : '#f4f3f4'}
              />
              <Text style={styles.amenityLabel}>Parking</Text>
            </View>
          </View>
          
          <View style={styles.amenityRow}>
            <View style={styles.amenityItem}>
              <Switch
                value={amenities.pool}
                onValueChange={() => toggleAmenity('pool')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={amenities.pool ? '#007AFF' : '#f4f3f4'}
              />
              <Text style={styles.amenityLabel}>Pool</Text>
            </View>
            
            <View style={styles.amenityItem}>
              <Switch
                value={amenities.gym}
                onValueChange={() => toggleAmenity('gym')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={amenities.gym ? '#007AFF' : '#f4f3f4'}
              />
              <Text style={styles.amenityLabel}>Gym</Text>
            </View>
          </View>
          
          <View style={styles.amenityRow}>
            <View style={styles.amenityItem}>
              <Switch
                value={amenities.restaurant}
                onValueChange={() => toggleAmenity('restaurant')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={amenities.restaurant ? '#007AFF' : '#f4f3f4'}
              />
              <Text style={styles.amenityLabel}>Restaurant</Text>
            </View>
            
            <View style={styles.amenityItem}>
              <Switch
                value={amenities.spa}
                onValueChange={() => toggleAmenity('spa')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={amenities.spa ? '#007AFF' : '#f4f3f4'}
              />
              <Text style={styles.amenityLabel}>Spa</Text>
            </View>
          </View>
          
          <View style={styles.amenityRow}>
            <View style={styles.amenityItem}>
              <Switch
                value={amenities.airConditioning}
                onValueChange={() => toggleAmenity('airConditioning')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={amenities.airConditioning ? '#007AFF' : '#f4f3f4'}
              />
              <Text style={styles.amenityLabel}>AC</Text>
            </View>
            
            <View style={styles.amenityItem}>
              <Switch
                value={amenities.roomService}
                onValueChange={() => toggleAmenity('roomService')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={amenities.roomService ? '#007AFF' : '#f4f3f4'}
              />
              <Text style={styles.amenityLabel}>Room Service</Text>
            </View>
          </View>
          
          <View style={styles.amenityRow}>
            <View style={styles.amenityItem}>
              <Switch
                value={amenities.petFriendly}
                onValueChange={() => toggleAmenity('petFriendly')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={amenities.petFriendly ? '#007AFF' : '#f4f3f4'}
              />
              <Text style={styles.amenityLabel}>Pet Friendly</Text>
            </View>
            
            <View style={styles.amenityItem}>
              <Switch
                value={amenities.conferenceRoom}
                onValueChange={() => toggleAmenity('conferenceRoom')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={amenities.conferenceRoom ? '#007AFF' : '#f4f3f4'}
              />
              <Text style={styles.amenityLabel}>Conference Room</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Images */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Photos *</Text>
        <View style={styles.imagesContainer}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              <TouchableOpacity 
                style={styles.removeImageBtn} 
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={26} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addImageButton} 
            onPress={pickImage}
          >
            <Ionicons name="add" size={40} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.imageHint}>Add up to 10 images (tap to add)</Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Add Hotel</Text>
        )}
      </TouchableOpacity>

      {/* Custom Time Pickers */}
      <CustomTimePicker
        visible={showCheckInPicker}
        onClose={() => setShowCheckInPicker(false)}
        onSelect={(time) => setCheckInTime(time)}
        initialHour={checkInTime.getHours()}
        initialMinute={checkInTime.getMinutes()}
      />

      <CustomTimePicker
        visible={showCheckOutPicker}
        onClose={() => setShowCheckOutPicker(false)}
        onSelect={(time) => setCheckOutTime(time)}
        initialHour={checkOutTime.getHours()}
        initialMinute={checkOutTime.getMinutes()}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F5',
    paddingBottom: 20,
  },
  
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
  },
  
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  
  icon: {
    marginRight: 12,
  },
  
  hint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    marginLeft: 12,
  },
  
  hoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  
  timeSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 14,
    marginHorizontal: 4,
  },
  
  timeIcon: {
    marginRight: 8,
  },
  
  roomTypeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  
  roomTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  roomTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  
  amenitiesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  
  amenityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  
  amenityLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333333',
  },
  
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  
  imageContainer: {
    width: '31%',
    aspectRatio: 1,
    marginRight: '2%',
    marginBottom: 8,
    position: 'relative',
  },
  
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 13,
  },
  
  addImageButton: {
    width: '31%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '2%',
    marginBottom: 8,
  },
  
  imageHint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  submitButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  cancelButton: {
    backgroundColor: '#FF3B30',
    marginTop: 0,
  },
  
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Separate Time Picker Styles
const timePickerStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  
  modalView: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
    marginBottom: 20,
  },
  
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  
  pickerLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  
  picker: {
    width: 80,
    height: 160,
  },
  
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  selectedItem: {
    backgroundColor: '#F0F6FF',
    borderRadius: 8,
  },
  
  pickerItemText: {
    fontSize: 16,
    color: '#666666',
  },
  
  selectedItemText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  
  amPmContainer: {
    height: 160,
    justifyContent: 'center',
  },
  
  amPmButton: {
    padding: 12,
    marginVertical: 8,
    width: 60,
    alignItems: 'center',
    borderRadius: 8,
  },
  
  selectedAmPm: {
    backgroundColor: '#F0F6FF',
  },
  
  amPmText: {
    fontSize: 16,
    color: '#666666',
  },
  
  selectedAmPmText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  
  buttonCancel: {
    backgroundColor: '#F0F0F0',
  },
  
  buttonCancelText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  
  buttonConfirm: {
    backgroundColor: '#007AFF',
  },
  
  buttonConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AddHotelScreen;