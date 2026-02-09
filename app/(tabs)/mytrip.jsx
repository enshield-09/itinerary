import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View, Animated, Easing } from 'react-native';
import StartNewTripCard from '../../components/MyTrips/StartNewTripCard';
import UserTripList from '../../components/MyTrips/UserTripList';
import { auth, db } from '../../configs/FirebaseConfig';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function MyTrip() {
  const router = useRouter();
  const [userTrips, setUserTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const user = auth.currentUser;
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation value for entry
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    user && GetMyTrips();
  }, [user])

  useEffect(() => {
    // Run entry animation when data is loaded
    if (!loading && userTrips.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        })
      ]).start();
    }
  }, [loading, userTrips]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTrips(userTrips);
    } else {
      const filtered = userTrips.filter(trip => {
        try {
          const parsed = typeof trip.tripData === 'string' ? JSON.parse(trip.tripData) : trip.tripData;
          const locationName = parsed?.locationInfo?.name || trip?.tripPlan?.location || '';
          return locationName.toLowerCase().includes(searchQuery.toLowerCase());
        } catch {
          return false;
        }
      });
      setFilteredTrips(filtered);
    }
  }, [searchQuery, userTrips]);

  const GetMyTrips = async () => {
    setLoading(true);
    setUserTrips([]);
    const q = query(collection(db, 'ItineraryApp'), where('userEmail', '==', user?.email));
    const querySnapshot = await getDocs(q);

    const trips = [];
    querySnapshot.forEach((doc) => {
      // console.log(doc.id, "=>", doc.data());
      trips.push({ ...doc.data(), docId: doc.id });
    });
    setUserTrips(trips);
    setLoading(false);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await GetMyTrips();
    setRefreshing(false);
  };

  const handleDeleteTrip = async (docId) => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'ItineraryApp', docId));
              // Refresh the trip list
              GetMyTrips();
            } catch (error) {
              console.error('Error deleting trip:', error);
              Alert.alert('Error', 'Failed to delete trip. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      {/* Decorative Gradient Header Background */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: 0 }}>
        <LinearGradient
          colors={[Colors.PRIMARY + '10', 'transparent']} // Light primary color fade
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <ScrollView
        style={{ padding: 25, paddingTop: 55, flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.PRIMARY} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          display: 'flex',
          flexDirection: 'row',
          alignContent: 'center',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Text style={{
            fontFamily: 'outfit-bold',
            fontSize: 35,
            color: Colors.BLACK
          }}>My Trips</Text>
          <TouchableOpacity
            onPress={() => router.push('/create-trip/search-place')}
            style={{
              backgroundColor: Colors.PRIMARY,
              width: 50,
              height: 50,
              borderRadius: 25,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: Colors.PRIMARY,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5
            }}
          >
            <Ionicons name="add" size={30} color={Colors.WHITE} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {userTrips.length > 0 && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            padding: 12,
            borderRadius: 12,
            marginTop: 20,
            marginBottom: 10
          }}>
            <Ionicons name="search" size={20} color={Colors.GRAY} />
            <TextInput
              placeholder="Search your trips..."
              style={{ flex: 1, marginLeft: 10, fontFamily: 'outfit', fontSize: 16 }}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        {loading && userTrips.length == 0 ? (
          <View style={{ marginTop: 100 }}>
            <ActivityIndicator size={'large'} color={Colors.PRIMARY} />
          </View>
        ) : userTrips?.length == 0 ? (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <StartNewTripCard />
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <UserTripList userTrips={filteredTrips} onDeleteTrip={handleDeleteTrip} />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}