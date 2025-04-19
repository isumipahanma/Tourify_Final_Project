import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions } from 'react-native';

function DestinationDetail({ route }) {
  const { destination } = route.params;
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false} 
          style={styles.imageScrollView}
        >
          {destination.imageUrls.map((url, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image 
                source={{ uri: url }} 
                style={[styles.image, { width: screenWidth - 40 }]} 
              />
              <Text style={styles.destinationName}>{destination.placeName}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.description}>{destination.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    marginTop: 50,
  },
  imageScrollView: {
    paddingHorizontal: 20,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    height: 250,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  destinationName: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    fontWeight: 'bold',
    color: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  detailsContainer: {
    padding: 20,
    marginTop: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: '#555',
  },
});

export default DestinationDetail;