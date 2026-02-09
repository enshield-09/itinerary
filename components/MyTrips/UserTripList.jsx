import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import moment from 'moment';
import { useState, useMemo } from 'react';
import { Text, TouchableOpacity, View, Image, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import UserTripCard from '../../components/MyTrips/UserTripCard';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');
const API_KEY = 'AIzaSyBNiTVqT-LJpDzl5i2WlVuYtUsK8yMF7Oc';

export default function UserTripList({ userTrips, onDeleteTrip }) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);

  // 1. Optimize: Memoize parsing so it only happens when userTrips changes
  const parsedTrips = useMemo(() => {
    if (!userTrips) return [];
    return userTrips
      .map((trip) => {
        try {
          const data = typeof trip.tripData === 'string' ? JSON.parse(trip.tripData) : trip.tripData;
          return { ...trip, parsedData: data, docId: trip.docId };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.parsedData?.startDate || 0) - new Date(a.parsedData?.startDate || 0));
  }, [userTrips]);

  if (!parsedTrips || parsedTrips.length === 0) return null;

  const latestTrip = parsedTrips[0];
  const { locationInfo, startDate, traveler } = latestTrip.parsedData;
  const locationName = locationInfo?.name || latestTrip?.tripPlan?.location || 'No location available';
  const photoRef = locationInfo?.photoRef;

  const imageUrl = photoRef
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${API_KEY}`
    : null;

  // Render Header (Featured Trip)
  const renderHeader = () => (
    <View style={{ marginTop: 20, marginBottom: 10 }}>
      {/* Featured Trip Card */}
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        padding: 15,
      }}>
        {/* Image Container */}
        <View style={{
          width: '100%',
          height: 220,
          borderRadius: 15,
          overflow: 'hidden',
          backgroundColor: '#e0e0e0'
        }}>
          {imageUrl ? (
            <>
              <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <View style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0'
                }}>
                  <ActivityIndicator size="large" color={Colors.PRIMARY} />
                </View>
              )}
            </>
          ) : (
            <Image
              source={require('../../assets/images/paris.jpg')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          )}
        </View>

        <View style={{ marginTop: 15 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontFamily: 'outfit-bold', flex: 1, color: Colors.BLACK }} numberOfLines={1}>
              {locationName}
            </Text>
            {onDeleteTrip && (
              <TouchableOpacity onPress={() => onDeleteTrip(latestTrip.docId)} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={24} color={Colors.RED} />
              </TouchableOpacity>
            )}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="calendar-outline" size={16} color={Colors.GRAY} />
              <Text style={{ fontFamily: 'outfit', color: Colors.GRAY }}>
                {startDate ? moment(startDate).format('DD MMM YYYY') : 'Date TBD'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="people-outline" size={16} color={Colors.GRAY} />
              <Text style={{ fontFamily: 'outfit', color: Colors.GRAY }}>
                {typeof traveler === 'object' ? traveler?.title : traveler}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push({ pathname: '/trip-details', params: { docId: latestTrip.docId } })}
            style={{
              backgroundColor: Colors.PRIMARY,
              padding: 15,
              borderRadius: 15,
              marginTop: 20,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: Colors.WHITE, fontFamily: 'outfit-medium', fontSize: 18 }}>
              See your Plan
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {parsedTrips.length > 1 && (
        <Text style={{ fontFamily: 'outfit-bold', fontSize: 20, marginTop: 25, marginBottom: 5 }}>All Trips</Text>
      )}
    </View>
  );

  // 2. Optimization: Use FlatList instead of ScrollView
  return (
    <View style={{ flex: 1, paddingBottom: 20 }}>
      <FlatList
        data={parsedTrips}
        keyExtractor={(item) => item.docId}
        renderItem={({ item, index }) => (
          <UserTripCard trip={item} index={index} onDelete={onDeleteTrip ? () => onDeleteTrip(item.docId) : null} />
        )}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
