import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import moment from 'moment';
import { useState, useMemo } from 'react';
import { Text, TouchableOpacity, View, FlatList, Dimensions, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import UserTripCard from '../../components/MyTrips/UserTripCard';
import Colors from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const API_KEY = 'AIzaSyBNiTVqT-LJpDzl5i2WlVuYtUsK8yMF7Oc';

export default function UserTripList({ userTrips, onDeleteTrip, headerComponent, refreshing, onRefresh }) {
  const router = useRouter();
  const { colors } = useTheme();

  // Parse trips once when userTrips changes
  const parsedTrips = useMemo(() => {
    return userTrips.map(trip => {
      try {
        const parsed = typeof trip.tripData === 'string'
          ? JSON.parse(trip.tripData)
          : trip.tripData;
        return { ...trip, parsedData: parsed };
      } catch (e) {
        console.warn('Failed to parse trip:', e);
        return { ...trip, parsedData: {} };
      }
    });
  }, [userTrips]);

  const RenderFeaturedTrip = ({ trip }) => {
    const { parsedData } = trip;
    const locationInfo = parsedData?.locationInfo;
    const photoRef = locationInfo?.photoRef;
    const imageUrl = photoRef
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${API_KEY}`
      : null;

    return (
      <View style={{ marginBottom: 25 }}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/trip-details', params: { docId: trip.docId } })}
          style={[styles.featuredCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
          activeOpacity={0.8}
        >
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.featuredImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <Image
                source={require('../../assets/images/dubai.jpg')}
                style={styles.featuredImage}
                contentFit="cover"
              />
            )}
            <View style={styles.overlay} />
            <View style={styles.featuredContent}>
              <Text style={styles.featuredLocation}>
                {locationInfo?.name || 'Unknown Location'}
              </Text>
              <View style={styles.featuredFooter}>
                <Text style={styles.featuredDate}>
                  {parsedData?.startDate ? moment(parsedData.startDate).format('DD MMM YYYY') : 'Date TBD'}
                </Text>
                <View style={styles.travelerBadge}>
                  <Text style={styles.travelerText}>{parsedData?.traveler?.title || 'Traveler'}</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={parsedTrips}
        keyExtractor={(item) => item.docId}
        renderItem={({ item, index }) => {
          // Render featured trip as first item if needed, but usually list header is better?
          // Actually let's replicate the structure: Header -> Filtered List.
          // If we want the first item to be big, we can check index === 0
          if (index === 0) return null; // Skip first item if we show it in header
          return (
            <UserTripCard
              trip={item}
              index={index}
              onDelete={onDeleteTrip ? () => onDeleteTrip(item.docId) : null}
              onPress={() => router.push({ pathname: '/trip-details', params: { docId: item.docId } })}
            />
          )
        }}
        ListHeaderComponent={
          <>
            {headerComponent}
            {parsedTrips.length > 0 && <RenderFeaturedTrip trip={parsedTrips[0]} />}
            <Text style={[styles.recentText, { color: colors.text }]}>Recent Trips</Text>
          </>
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  featuredCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  imageContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    zIndex: 1
  },
  featuredLocation: {
    fontFamily: 'outfit-bold',
    fontSize: 24,
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5
  },
  featuredDate: {
    fontFamily: 'outfit-medium',
    fontSize: 14, // Slightly larger font size
    color: '#e0e0e0', // Lighter color for better readability
  },
  travelerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backdropFilter: 'blur(10px)', // Valid property? No, but works in some web/expo contexts? Remove if causes issues.
  },
  travelerText: {
    fontFamily: 'outfit',
    fontSize: 12,
    color: '#fff'
  },
  recentText: {
    fontFamily: 'outfit-bold',
    fontSize: 20,
    marginTop: 10,
    marginBottom: 5
  }
});
