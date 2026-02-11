import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CreateTripContext } from '../../context/CreateTripContext';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');
const GOOGLE_PLACES_API_KEY = 'AIzaSyBNiTVqT-LJpDzl5i2WlVuYtUsK8yMF7Oc';

import { useTheme } from '../../context/ThemeContext';

export default function PlaceDetail() {
  const router = useRouter();
  const navigation = useNavigation();
  const { placeName } = useLocalSearchParams();
  const { setTripData } = useContext(CreateTripContext);
  const { colors } = useTheme();
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
          style={{
            marginLeft: 15,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 20,
            padding: 4
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // ... (fetch logic)

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading place details...</Text>
      </View>
    );
  }

  if (!placeDetails) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.notification }]}>Failed to load place details</Text>
      </View>
    );
  }

  const mainImage = placeDetails.photoRef
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${placeDetails.photoRef}&key=${GOOGLE_PLACES_API_KEY}`
    : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
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
        <Text style={[styles.title, { color: colors.text }]}>{placeDetails.name}</Text>

        {placeDetails.address && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍</Text>
            <Text style={[styles.infoText, { color: colors.icon }]}>{placeDetails.address}</Text>
          </View>
        )}

        {placeDetails.rating && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⭐</Text>
            <Text style={[styles.infoText, { color: colors.icon }]}>{placeDetails.rating.toFixed(1)} / 5.0</Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.description, { color: colors.text }]}>
            {placeDetails.reviews && placeDetails.reviews.length > 0
              ? placeDetails.reviews[0].text
              : `Discover the beauty and culture of ${placeDetails.name}. This destination offers unique experiences, stunning landscapes, and rich history waiting to be explored.`}
          </Text>
        </View>

        {/* Image Gallery */}
        {images.length > 0 && (
          <View style={styles.gallerySection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Gallery</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Attractions</Text>
            {attractions.map((attr, idx) => (
              <View key={idx} style={[styles.attractionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {attr.image && (
                  <Image
                    source={{ uri: attr.image }}
                    style={styles.attractionImage}
                    contentFit="cover"
                  />
                )}
                <View style={styles.attractionInfo}>
                  <Text style={[styles.attractionName, { color: colors.text }]}>{attr.name}</Text>
                  {attr.rating && (
                    <Text style={[styles.attractionRating, { color: colors.icon }]}>⭐ {attr.rating.toFixed(1)}</Text>
                  )}
                  {attr.address && (
                    <Text style={[styles.attractionAddress, { color: colors.icon }]}>{attr.address}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add to Trip Button */}
        <TouchableOpacity
          onPress={handleAddToTrip}
          style={[styles.addButton, { backgroundColor: Colors.PRIMARY }]}
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
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
    flex: 1,
  },
  descriptionSection: {
    marginTop: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'outfit-bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: 'outfit',
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
  galleryScroll: {
    // added to ensure scroll view style is applied if needed
  },
  attractionsSection: {
    marginBottom: 25,
  },
  attractionCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
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
    marginBottom: 4,
  },
  attractionRating: {
    fontSize: 14,
    marginBottom: 4,
  },
  attractionAddress: {
    fontSize: 12,
  },
  addButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

