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
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from 'react-native-vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../firebase/firebase'; // Adjust path as needed

// Custom Time Picker Component
const CustomTimePicker = ({ visible, onClose, onSelect, initialHour = 9, initialMinute = 0 }) => {
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

const AddRestaurantScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [images, setImages] = useState([]);
  const [openTimeFrom, setOpenTimeFrom] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [openTimeTo, setOpenTimeTo] = useState(new Date(new Date().setHours(20, 0, 0, 0)));
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can only upload up to 5 images");
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

  const uploadImage = async (uri) => {
    const storage = getStorage();
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const storageRef = ref(storage, `restaurants/${Date.now()}_${filename}`);

    // Fetch the image and convert to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload blob to Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!name || !description || !location || !cuisine || images.length === 0) {
      Alert.alert('Missing Information', 'Please fill in all required fields and add at least one image');
      return;
    }

    setIsLoading(true);

    try {
      // Upload images and get URLs
      const imageUrls = await Promise.all(images.map(uri => uploadImage(uri)));

      // Format operating hours
      const operatingHours = {
        from: formatTime(openTimeFrom),
        to: formatTime(openTimeTo)
      };

      // Create restaurant document
      const restaurantData = {
        name,
        description,
        location,
        cuisine,
        priceRange,
        contactNumber,
        website,
        imageUrls,
        operatingHours,
        addedBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to Firestore
      await addDoc(collection(firestore, 'restaurants'), restaurantData);

      Alert.alert(
        'Success', 
        'Restaurant added successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding restaurant:', error);
      Alert.alert('Error', 'Failed to add restaurant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New Restaurant</Text>
      </View>
      
      {/* Restaurant Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Restaurant Name *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="restaurant-outline" size={22} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Enter restaurant name"
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
            placeholder="Enter restaurant description"
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
            placeholder="Enter restaurant address"
            value={location}
            onChangeText={setLocation}
          />
        </View>
      </View>

      {/* Cuisine */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cuisine Type *</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="restaurant-menu" size={22} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="E.g., Italian, Mexican, Thai"
            value={cuisine}
            onChangeText={setCuisine}
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
            placeholder="E.g., $, $$, $$$"
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

      {/* Operating Hours */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Operating Hours</Text>
        <View style={styles.hoursContainer}>
          <TouchableOpacity 
            style={styles.timeSelector} 
            onPress={() => setShowFromPicker(true)}
          >
            <Ionicons name="time-outline" size={22} color="#666" style={styles.timeIcon} />
            <Text>From: {formatTime(openTimeFrom)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.timeSelector} 
            onPress={() => setShowToPicker(true)}
          >
            <Ionicons name="time-outline" size={22} color="#666" style={styles.timeIcon} />
            <Text>To: {formatTime(openTimeTo)}</Text>
          </TouchableOpacity>
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
        <Text style={styles.imageHint}>Add up to 5 images (tap to add)</Text>
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
          <Text style={styles.submitButtonText}>Add Restaurant</Text>
        )}
      </TouchableOpacity>

      {/* Custom Time Pickers */}
      <CustomTimePicker
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        onSelect={(time) => setOpenTimeFrom(time)}
        initialHour={openTimeFrom.getHours()}
        initialMinute={openTimeFrom.getMinutes()}
      />

      <CustomTimePicker
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        onSelect={(time) => setOpenTimeTo(time)}
        initialHour={openTimeTo.getHours()}
        initialMinute={openTimeTo.getMinutes()}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  header: {
    marginVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  hoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeIcon: {
    marginRight: 10,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
    margin: 4,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 15,
  },
  addImageButton: {
    width: 100,
    height: 100,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  imageHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

// Styles for the custom time picker
const timePickerStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 160,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  picker: {
    height: 120,
    width: '100%',
  },
  pickerItem: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: 16,
  },
  selectedItem: {
    backgroundColor: '#e6f7ff',
    borderRadius: 5,
  },
  selectedItemText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  amPmContainer: {
    height: 120,
    justifyContent: 'center',
  },
  amPmButton: {
    padding: 15,
    alignItems: 'center',
    marginVertical: 5,
    borderRadius: 5,
  },
  amPmText: {
    fontSize: 16,
  },
  selectedAmPm: {
    backgroundColor: '#e6f7ff',
  },
  selectedAmPmText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#f2f2f2',
  },
  buttonCancelText: {
    color: '#666',
  },
  buttonConfirm: {
    backgroundColor: '#007AFF',
  },
  buttonConfirmText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default AddRestaurantScreen;