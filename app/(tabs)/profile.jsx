import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useEffect, useState, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, FlatList, Animated, Easing } from 'react-native';
import { auth, db } from '../../configs/FirebaseConfig';
import Colors from '../../constants/Colors';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
  const router = useRouter();
  const user = auth.currentUser;
  const [tripCount, setTripCount] = useState(0);
  const [recentTrips, setRecentTrips] = useState([]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (user) {
      fetchTripData();

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [user]);

  const fetchTripData = async () => {
    try {
      const q = query(
        collection(db, 'ItineraryApp'),
        where('userEmail', '==', user?.email)
      );
      const querySnapshot = await getDocs(q);
      setTripCount(querySnapshot.size);

      // Get recent trips for travel history
      const trips = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        try {
          const parsed = typeof data.tripData === 'string'
            ? JSON.parse(data.tripData)
            : data.tripData;
          trips.push({
            docId: data.docId,
            locationName: parsed?.locationInfo?.name || data.tripPlan?.location || 'Unknown',
            startDate: parsed?.startDate,
            traveler: parsed?.traveler,
            budget: parsed?.budget?.title
          });
        } catch (e) {
          console.error('Error parsing trip:', e);
        }
      });

      // Sort by date and take the 5 most recent
      trips.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
      setRecentTrips(trips.slice(0, 5));
    } catch (error) {
      console.error('Error fetching trip data:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const navigateToTrip = (docId) => {
    if (docId) {
      router.push({
        pathname: '/trip-details',
        params: { docId }
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Decorative Gradient Background */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300, zIndex: 0 }}>
        <LinearGradient
          colors={[Colors.PRIMARY, Colors.WHITE]}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>
          <Text style={styles.name}>{user?.displayName || user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </Animated.View>

        {/* Info Cards */}
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {/* Stats */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tripCount}</Text>
              <Text style={styles.statLabel}>Trips Planned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{recentTrips.length}</Text>
              <Text style={styles.statLabel}>Recent</Text>
            </View>
          </View>

          {/* Travel History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Travel History</Text>
            {recentTrips.length > 0 ? (
              recentTrips.map((trip, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.historyItem}
                  onPress={() => navigateToTrip(trip.docId)}
                >
                  <View style={styles.historyIcon}>
                    <Ionicons name="airplane" size={18} color={Colors.WHITE} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyLocation} numberOfLines={1}>{trip.locationName}</Text>
                    <Text style={styles.historyDate}>
                      {trip.startDate ? moment(trip.startDate).format('MMM Do, YYYY') : 'Date TBD'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.GRAY} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No trips yet. Start planning!</Text>
            )}

            {tripCount > 5 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/mytrip')}
              >
                <Text style={styles.viewAllText}>View All Trips</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.PRIMARY} />
              </TouchableOpacity>
            )}
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LinearGradient
              colors={[Colors.RED, '#ff6b6b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signOutGradient}
            >
              <Ionicons name="log-out-outline" size={22} color="#fff" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* App Version */}
          <Text style={styles.version}>Itinerary AI v1.0 • Built with Expo</Text>
          <View style={{ height: 60 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    marginBottom: -30,
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontFamily: 'outfit-bold',
    color: Colors.PRIMARY,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: 26,
    fontFamily: 'outfit-bold',
    color: Colors.WHITE,
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    fontFamily: 'outfit',
    color: 'rgba(255,255,255,0.9)',
  },
  contentContainer: {
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 40,
    minHeight: 500,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 10,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'outfit-bold',
    color: Colors.BLACK,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'outfit',
    color: Colors.GRAY,
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'outfit-bold',
    color: Colors.BLACK,
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyLocation: {
    fontSize: 15,
    fontFamily: 'outfit-medium',
    color: Colors.BLACK,
  },
  historyDate: {
    fontSize: 12,
    fontFamily: 'outfit',
    color: Colors.GRAY,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'outfit',
    color: Colors.GRAY,
    textAlign: 'center',
    paddingVertical: 20,
  },
  viewAllButton: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'outfit-medium',
    color: Colors.PRIMARY,
  },
  signOutButton: {
    marginBottom: 20,
    shadowColor: Colors.RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'outfit-bold',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'outfit',
    color: '#ccc',
  },
});