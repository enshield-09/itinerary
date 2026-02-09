import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CreateTripContext } from '../../context/CreateTripContext';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');
const GOOGLE_PLACES_API_KEY = 'AIzaSyBNiTVqT-LJpDzl5i2WlVuYtUsK8yMF7Oc';

export default function PlaceDetail() {
  const router = useRouter();
  const navigation = useNavigation();
  const { placeName } = useLocalSearchParams();
  const { setTripData } = useContext(CreateTripContext);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: '',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginLeft: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (placeName) {
      fetchPlaceDetails(placeName.toString());
    }
  }, [placeName]);

  const fetchPlaceDetails = async (name) => {
    setLoading(true);
    try {
      // Search for the place
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&key=${GOOGLE_PLACES_API_KEY}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.results && searchData.results.length > 0) {
        const place = searchData.results[0];

        // Get place details
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,photos,rating,reviews,geometry,types&key=${GOOGLE_PLACES_API_KEY}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        if (detailsData.result) {
          const result = detailsData.result;

          // Get images
          const placeImages = [];
          if (result.photos) {
            result.photos.slice(0, 5).forEach(photo => {
              placeImages.push(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`);
            });
          }
          setImages(placeImages);

          // Search for nearby attractions
          const attractionsUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${place.geometry.location.lat},${place.geometry.location.lng}&radius=5000&type=tourist_attraction&key=${GOOGLE_PLACES_API_KEY}`;
          const attractionsResponse = await fetch(attractionsUrl);
          const attractionsData = await attractionsResponse.json();

          const attractionsList = [];
          if (attractionsData.results) {
            attractionsData.results.slice(0, 10).forEach(attr => {
              attractionsList.push({
                name: attr.name,
                rating: attr.rating,
                image: attr.photos?.[0] ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${attr.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}` : null,
                address: attr.vicinity
              });
            });
          }
          setAttractions(attractionsList);

          setPlaceDetails({
            name: result.name || name,
            address: result.formatted_address || place.formatted_address,
            rating: result.rating || place.rating,
            reviews: result.reviews || [],
            coordinates: place.geometry.location,
            photoRef: place.photos?.[0]?.photo_reference
          });
        } else {
          // Fallback if details not available
          setPlaceDetails({
            name: place.name || name,
            address: place.formatted_address,
            rating: place.rating,
            coordinates: place.geometry.location,
            photoRef: place.photos?.[0]?.photo_reference
          });
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      // Fallback with basic info
      setPlaceDetails({
        name: name,
        address: '',
        rating: null,
        coordinates: null,
        photoRef: null
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTrip = () => {
    if (!placeDetails) return;

    // Set the location in trip context
    setTripData(prev => ({
      ...prev,
      locationInfo: {
        name: placeDetails.name,
        coordinates: placeDetails.coordinates,
        photoRef: placeDetails.photoRef,
        url: null
      }
    }));

    // Navigate to select origin (skipping place selection, asking for current location)
    router.push('/create-trip/select-origin');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Loading place details...</Text>
      </View>
    );
  }

  if (!placeDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load place details</Text>
      </View>
    );
  }

  const mainImage = placeDetails.photoRef
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${placeDetails.photoRef}&key=${GOOGLE_PLACES_API_KEY}`
    : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {mainImage && (
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: mainImage }}
            style={styles.heroImage}
            contentFit="cover"
            placeholder={require('../../assets/images/hotel.jpg')}
          />
          <View style={styles.heroOverlay} />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{placeDetails.name}</Text>

        {placeDetails.address && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍</Text>
            <Text style={styles.infoText}>{placeDetails.address}</Text>
          </View>
        )}

        {placeDetails.rating && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⭐</Text>
            <Text style={styles.infoText}>{placeDetails.rating.toFixed(1)} / 5.0</Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>
            {placeDetails.reviews && placeDetails.reviews.length > 0
              ? placeDetails.reviews[0].text
              : `Discover the beauty and culture of ${placeDetails.name}. This destination offers unique experiences, stunning landscapes, and rich history waiting to be explored.`}
          </Text>
        </View>

        {/* Image Gallery */}
        {images.length > 0 && (
          <View style={styles.gallerySection}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.galleryScroll}
            >
              {images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img }}
                  style={styles.galleryImage}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Attractions */}
        {attractions.length > 0 && (
          <View style={styles.attractionsSection}>
            <Text style={styles.sectionTitle}>Nearby Attractions</Text>
            {attractions.map((attr, idx) => (
              <View key={idx} style={styles.attractionCard}>
                {attr.image && (
                  <Image
                    source={{ uri: attr.image }}
                    style={styles.attractionImage}
                    contentFit="cover"
                  />
                )}
                <View style={styles.attractionInfo}>
                  <Text style={styles.attractionName}>{attr.name}</Text>
                  {attr.rating && (
                    <Text style={styles.attractionRating}>⭐ {attr.rating.toFixed(1)}</Text>
                  )}
                  {attr.address && (
                    <Text style={styles.attractionAddress}>{attr.address}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add to Trip Button */}
        <TouchableOpacity
          onPress={handleAddToTrip}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>Add to Trip</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.GRAY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.RED,
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'outfit-bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 18,
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    fontFamily: 'outfit',
    color: '#666',
    flex: 1,
  },
  descriptionSection: {
    marginTop: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'outfit-bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: 'outfit',
    color: '#444',
    lineHeight: 22,
  },
  gallerySection: {
    marginBottom: 25,
  },
  galleryImage: {
    width: width * 0.7,
    height: 200,
    borderRadius: 12,
    marginRight: 15,
  },
  attractionsSection: {
    marginBottom: 25,
  },
  attractionCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  attractionImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  attractionInfo: {
    flex: 1,
  },
  attractionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  attractionRating: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  attractionAddress: {
    fontSize: 12,
    color: '#999',
  },
  addButton: {
    backgroundColor: Colors.BLACK,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  addButtonText: {
    color: Colors.WHITE,
    fontSize: 18,
    fontWeight: '600',
  },
});

