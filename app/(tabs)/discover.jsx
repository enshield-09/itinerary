import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useContext, useState, useRef, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Animated, Easing, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { PopularPlaces } from '../../constants/PopularPlaces';
import { TripPackages } from '../../constants/Options';
import { CreateTripContext } from '../../context/CreateTripContext';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../../configs/FirebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

export default function Discover() {
  const router = useRouter();
  const { setTripData } = useContext(CreateTripContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userPreferences, setUserPreferences] = useState([]);
  const [personalizedPackages, setPersonalizedPackages] = useState([]);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  // Animation value for entry
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // Filter categories
  const categories = ['All', 'Couple', 'Family', 'Solo', 'Friends', 'Luxury', 'Budget', 'Adventure'];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      })
    ]).start();

    // Fetch user preferences from their past trips
    fetchUserPreferences();
  }, []);

  // Analyze user's past trips to extract preferences
  const fetchUserPreferences = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setPersonalizedPackages(TripPackages);
        setLoadingPrefs(false);
        return;
      }

      // Fetch user's past trips
      const q = query(
        collection(db, "ItineraryApp"),
        where("userEmail", "==", user.email)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setPersonalizedPackages(TripPackages);
        setLoadingPrefs(false);
        return;
      }

      // Extract preferences from past trips
      const prefCounts = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        let tripData = data.tripData;

        if (typeof tripData === 'string') {
          try {
            tripData = JSON.parse(tripData);
          } catch (e) {
            return;
          }
        }

        // Count budget preferences
        if (tripData?.budget?.title) {
          const budgetTag = tripData.budget.title;
          prefCounts[budgetTag] = (prefCounts[budgetTag] || 0) + 2; // Higher weight
        }

        // Count traveler type preferences
        if (tripData?.traveler?.title) {
          const travelerTag = tripData.traveler.title === 'Just Me' ? 'Solo' : tripData.traveler.title;
          prefCounts[travelerTag] = (prefCounts[travelerTag] || 0) + 2;
        }

        // Count attraction preferences
        if (tripData?.selectedAttractions) {
          tripData.selectedAttractions.forEach(attr => {
            prefCounts[attr.title] = (prefCounts[attr.title] || 0) + 1;
          });
        }
      });

      // Sort preferences by count
      const sortedPrefs = Object.entries(prefCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => key);

      setUserPreferences(sortedPrefs);

      // Score and sort packages based on preferences
      const scoredPackages = TripPackages.map(pkg => {
        let score = 0;
        const tags = pkg.tags || [];
        const travelerType = pkg.tripData?.traveler?.title;
        const budgetType = pkg.tripData?.budget?.title;

        // Higher score for matching tags
        tags.forEach(tag => {
          const idx = sortedPrefs.indexOf(tag);
          if (idx !== -1) {
            score += (10 - idx); // Earlier prefs = higher score
          }
        });

        // Bonus for matching traveler type
        if (travelerType && sortedPrefs.includes(travelerType)) {
          score += 5;
        }

        // Bonus for matching budget
        if (budgetType && sortedPrefs.includes(budgetType)) {
          score += 5;
        }

        return { ...pkg, score };
      });

      // Sort by score (highest first)
      scoredPackages.sort((a, b) => b.score - a.score);

      setPersonalizedPackages(scoredPackages);
      setLoadingPrefs(false);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      setPersonalizedPackages(TripPackages);
      setLoadingPrefs(false);
    }
  };

  // Filter packages by selected category
  const filteredPackages = selectedCategory === 'All'
    ? personalizedPackages
    : personalizedPackages.filter(pkg => {
      const tags = pkg.tags || [];
      const traveler = pkg.tripData?.traveler?.title || '';
      const budget = pkg.tripData?.budget?.title || '';
      return tags.includes(selectedCategory) ||
        traveler.includes(selectedCategory) ||
        budget === selectedCategory ||
        (selectedCategory === 'Solo' && traveler === 'Just Me') ||
        (selectedCategory === 'Budget' && budget === 'Cheap');
    });

  const handleQuickTripSearch = () => {
    if (!searchQuery.trim()) return;

    const defaultTrip = {
      locationInfo: {
        name: searchQuery.trim(),
        coordinates: null,
        photoRef: null,
        url: null
      },
      traveler: {
        id: 2,
        title: 'Couple',
        desc: 'A romantic getaway',
        people: '2 People',
        icon: '🥂'
      },
      budget: {
        id: 2,
        title: 'Moderate',
        desc: 'Keep cost on the average side',
        icon: '💰'
      },
      totalNoOfDays: 5,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
    };

    setTripData(defaultTrip);
    router.push('/create-trip/generate-trip');
  };

  const handlePackagePress = (pkg) => {
    setTripData(pkg.tripData);
    router.push('/create-trip/generate-trip');
  };

  const handlePopularPlacePress = (place) => {
    router.push({
      pathname: '/discover/place-detail',
      params: { placeName: place.name }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      {/* Decorative Gradient Header Background */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180, zIndex: 0 }}>
        <LinearGradient
          colors={['#E0F7FA', 'transparent']}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY }] }]}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>
            {userPreferences.length > 0
              ? `✨ Personalized for you based on past trips`
              : 'Find your next dream destination'}
          </Text>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={[styles.searchContainer, { opacity: fadeAnim, transform: [{ translateY }] }]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.GRAY} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search any destination..."
              placeholderTextColor={Colors.GRAY}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleQuickTripSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.GRAY} />
              </TouchableOpacity>
            )}
          </View>
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.quickTripBtn} onPress={handleQuickTripSearch}>
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={styles.quickTripText}>Generate Quick Trip</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Category Filter Pills */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat && styles.categoryPillActive
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive
                ]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Personalized Trip Packages */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {userPreferences.length > 0 ? 'Recommended For You ✨' : 'Curated Packages ✈️'}
            </Text>
            {userPreferences.length > 0 && (
              <View style={styles.prefBadge}>
                <Ionicons name="sparkles" size={12} color={Colors.PRIMARY} />
                <Text style={styles.prefBadgeText}>AI Matched</Text>
              </View>
            )}
          </View>

          {loadingPrefs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.PRIMARY} />
              <Text style={styles.loadingText}>Analyzing your preferences...</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
              {filteredPackages.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.packageCard}
                  onPress={() => handlePackagePress(item)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={item.image}
                    style={styles.packageImage}
                    contentFit="cover"
                  />
                  <View style={styles.packageBadge}>
                    <Text style={styles.packageBadgeText}>{item.duration}</Text>
                  </View>
                  {item.score > 0 && index < 3 && (
                    <View style={styles.matchBadge}>
                      <Ionicons name="heart" size={10} color="#fff" />
                      <Text style={styles.matchText}>Top Match</Text>
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.packageOverlay}
                  >
                    <Text style={styles.packageTitle}>{item.name}</Text>
                    <Text style={styles.packageDesc}>{item.desc}</Text>
                    <View style={styles.tagRow}>
                      {(item.tags || []).slice(0, 2).map((tag, i) => (
                        <View key={i} style={styles.tagChip}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.packageFooter}>
                      <Text style={styles.packagePrice}>{item.price}</Text>
                      <View style={styles.packageButton}>
                        <Text style={styles.packageButtonText}>View Plan</Text>
                        <Ionicons name="arrow-forward" size={14} color="white" />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Popular Destinations */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }], marginTop: 25 }}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <View style={styles.grid}>
            {PopularPlaces.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.placeCard}
                onPress={() => handlePopularPlacePress(item)}
                activeOpacity={0.8}
              >
                <Image
                  source={item.image}
                  style={styles.cardImage}
                  contentFit="cover"
                  transition={300}
                />
                <View style={styles.cardOverlay}>
                  <Text style={styles.placeName}>{item.name}</Text>
                  <Text style={styles.placeDesc} numberOfLines={1}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    paddingTop: 55,
  },
  header: {
    marginBottom: 25,
  },
  title: {
    fontSize: 34,
    fontFamily: 'outfit-bold',
    color: Colors.BLACK,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'outfit',
    color: Colors.GRAY,
    marginTop: 5,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'outfit',
    color: Colors.BLACK,
  },
  quickTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.PRIMARY,
    padding: 12,
    borderRadius: 12,
    marginTop: 15,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickTripText: {
    color: '#fff',
    fontFamily: 'outfit-medium',
    fontSize: 14,
    marginLeft: 8,
  },
  categoryContainer: {
    paddingBottom: 15,
    gap: 10,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: Colors.PRIMARY,
  },
  categoryText: {
    fontFamily: 'outfit-medium',
    fontSize: 13,
    color: Colors.GRAY,
  },
  categoryTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'outfit-bold',
    color: Colors.BLACK,
  },
  prefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  prefBadgeText: {
    fontFamily: 'outfit-medium',
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 10,
  },
  loadingText: {
    fontFamily: 'outfit',
    fontSize: 14,
    color: Colors.GRAY,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  placeCard: {
    width: cardWidth,
    height: 200,
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
  placeName: {
    fontSize: 16,
    fontFamily: 'outfit-bold',
    color: '#fff',
  },
  placeDesc: {
    fontSize: 12,
    fontFamily: 'outfit',
    color: '#eee',
  },
  packageCard: {
    width: 280,
    height: 220,
    marginRight: 15,
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6
  },
  packageImage: {
    width: '100%',
    height: '100%'
  },
  packageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    paddingTop: 50
  },
  packageBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  packageBadgeText: {
    fontFamily: 'outfit-bold',
    fontSize: 12,
    color: Colors.PRIMARY
  },
  matchBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  matchText: {
    fontFamily: 'outfit-bold',
    fontSize: 10,
    color: '#fff'
  },
  packageTitle: {
    fontFamily: 'outfit-bold',
    fontSize: 18,
    color: 'white',
    marginBottom: 2
  },
  packageDesc: {
    fontFamily: 'outfit',
    fontSize: 12,
    color: '#ddd',
    marginBottom: 6
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8
  },
  tagChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  tagText: {
    fontFamily: 'outfit',
    fontSize: 10,
    color: '#fff'
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  packagePrice: {
    fontFamily: 'outfit-bold',
    color: '#FFD700',
    fontSize: 14
  },
  packageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5
  },
  packageButtonText: {
    fontFamily: 'outfit-medium',
    color: 'white',
    fontSize: 10
  }
});