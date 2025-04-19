import React from 'react';
import { View, Image, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';  // Import navigation hook

function TopDestinations({ destinations }) {
  const navigation = useNavigation();  // Get navigation instance

  return (
    <View style={styles.topDestinationsContainer}>
      <Text style={styles.heading}>Top Destinations</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {destinations.map((destination) => (
          <TouchableOpacity
            key={destination.id}
            style={styles.destinationCard}
            onPress={() => navigation.navigate('DestinationDetail', { destination })}
          >
            <Image 
              source={{ uri: destination.imageUrls[0] }} 
              style={styles.destinationImage} 
            />
            <Text style={styles.destinationName}>{destination.placeName}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topDestinationsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    flex: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  destinationCard: {
    marginBottom: 20,
    position: 'relative',
  },
  destinationImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
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
});

export default TopDestinations;
