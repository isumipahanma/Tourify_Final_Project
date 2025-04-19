// utils/HotelClass.js
export class Hotel {
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
  
    // Get highest price from room types
    getHighestPrice() {
      if (!this.roomTypes || this.roomTypes.length === 0) return 'N/A';
      const prices = this.roomTypes
        .map(room => parseFloat(room.price))
        .filter(price => !isNaN(price));
      return prices.length > 0 ? Math.max(...prices).toString() : 'N/A';
    }
  
    // Get total available rooms
    getTotalAvailableRooms() {
      if (!this.roomTypes || this.roomTypes.length === 0) return 0;
      return this.roomTypes.reduce((total, room) => total + parseInt(room.quantity || 0), 0);
    }
  
    // Format a price range string
    getPriceRangeString() {
      const low = this.getLowestPrice();
      const high = this.getHighestPrice();
      
      if (low === 'N/A' || high === 'N/A') return 'N/A';
      if (low === high) return `$${low}`;
      return `$${low} - $${high}`;
    }
  }
  
  // Hotel utility functions
  export const HotelUtils = {
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