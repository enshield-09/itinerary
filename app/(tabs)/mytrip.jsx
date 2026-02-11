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

import { useTheme } from '../../context/ThemeContext';

export default function MyTrip() {
  const router = useRouter();
  const { colors } = useTheme();
  const [userTrips, setUserTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    userTrips.length === 0 && GetMyTrips();
  }, []);

  const GetMyTrips = async () => {
    setLoading(true);
    setUserTrips([]);
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const q = query(collection(db, 'ItineraryApp'), where('userEmail', '==', user.email));
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setUserTrips(data);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      startAnimations();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    GetMyTrips();
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  };

  const handleDeleteTrip = (tripId) => {
    Alert.alert(
      "Delete Trip",
      "Are you sure you want to delete this trip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "ItineraryApp", tripId));
              setUserTrips(prev => prev.filter(trip => trip.id !== tripId));
            } catch (error) {
              console.error("Error deleting trip:", error);
              Alert.alert("Error", "Failed to delete trip.");
            }
          }
        }
      ]
    );
  };

  const filteredTrips = userTrips.filter(trip => {
    try {
      const tripData = typeof trip.tripData === 'string' ? JSON.parse(trip.tripData) : trip.tripData;
      const locationName = tripData?.locationInfo?.name || '';
      return locationName.toLowerCase().includes(searchQuery.toLowerCase());
    } catch (e) {
      return true;
    }
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Decorative Gradient Header Background */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: 0 }}>
        <LinearGradient
          colors={[Colors.PRIMARY + '10', 'transparent']} // Light primary color fade
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <View style={{ padding: 25, paddingTop: 55, flex: 1 }}>
        {/* Header Component to Pass */}
        <View>
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
              color: colors.text
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
              backgroundColor: colors.card,
              padding: 12,
              borderRadius: 12,
              marginTop: 20,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: colors.border
            }}>
              <Ionicons name="search" size={20} color={colors.icon} />
              <TextInput
                placeholder="Search your trips..."
                placeholderTextColor={colors.icon}
                style={{ flex: 1, marginLeft: 10, fontFamily: 'outfit', fontSize: 16, color: colors.text }}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          )}
        </View>

        {loading && userTrips.length == 0 ? (
          <View style={{ marginTop: 100 }}>
            <ActivityIndicator size={'large'} color={Colors.PRIMARY} />
          </View>
        ) : userTrips?.length == 0 ? (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.PRIMARY} />
            }
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
              <StartNewTripCard />
            </Animated.View>
          </ScrollView>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }], flex: 1 }}>
            <UserTripList
              userTrips={filteredTrips}
              onDeleteTrip={handleDeleteTrip}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

