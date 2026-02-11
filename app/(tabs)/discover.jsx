import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Animated, Easing, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { PopularPlaces } from '../../constants/PopularPlaces';
import { TripPackages } from '../../constants/Options';
import { CreateTripContext } from '../../context/CreateTripContext';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../../configs/FirebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useTheme } from '../../context/ThemeContext';
import React from 'react';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

// Memoized Package Card
const PackageCard = React.memo(({ item, index, theme, colors, onPress }) => (
  <TouchableOpacity
    style={[styles.packageCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
    onPress={() => onPress(item)}
    activeOpacity={0.9}
  >
    <Image
      source={item.image}
      style={styles.packageImage}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={200}
    />
    <View style={[styles.packageBadge, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }]}>
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
));

// Memoized Place Card
const PlaceCard = React.memo(({ item, colors, onPress }) => (
  <TouchableOpacity
    style={[styles.placeCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
    onPress={() => onPress(item)}
    activeOpacity={0.8}
  >
    <Image
      source={item.image}
      style={styles.cardImage}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
    />
    <View style={styles.cardOverlay}>
      <Text style={styles.placeName}>{item.name}</Text>
      <Text style={styles.placeDesc} numberOfLines={1}>{item.desc}</Text>
    </View>
  </TouchableOpacity>
));

export default function Discover() {
  const router = useRouter();
  const { setTripData } = useContext(CreateTripContext);
  const { colors, theme } = useTheme();

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [userPreferences, setUserPreferences] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = useMemo(() => ['All', 'Mountain', 'Beach', 'City', 'Adventure'], []);

  const [filteredPackages, setFilteredPackages] = useState(TripPackages);

  useEffect(() => {
    fetchUserPreferences();
    startAnimations();
  }, []);

  useEffect(() => {
    filterPackages();
  }, [selectedCategory, userPreferences, searchQuery]);

  const fetchUserPreferences = async () => {
    setLoadingPrefs(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoadingPrefs(false);
        return;
      }
      const q = query(collection(db, 'ItineraryApp'), where('userEmail', '==', user.email));
      const snapshot = await getDocs(q);

      const prefs = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.tripData) {
          try {
            const parsed = JSON.parse(data.tripData);
            if (parsed.budget) prefs.push(parsed.budget);
          } catch (e) { }
        }
      });
      setUserPreferences(prefs);
    } catch (e) {
      console.log("Error fetching preferences", e);
    } finally {
      setLoadingPrefs(false);
    }
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  };

  const filterPackages = () => {
    let result = TripPackages;
    if (selectedCategory !== 'All') {
      result = result.filter(item => (item.tags || []).includes(selectedCategory));
    }
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(lowerQ) ||
        item.desc.toLowerCase().includes(lowerQ)
      );
    }
    const scored = result.map(item => {
      let score = 0;
      if (userPreferences.some(pref => (item.tags || []).includes(pref))) {
        score += 5;
      }
      return { ...item, score };
    });
    scored.sort((a, b) => b.score - a.score);
    setFilteredPackages(scored);
  };

  const handleQuickTripSearch = () => {
    if (!searchQuery) return;
    router.push({
      pathname: '/create-trip/search-place',
      params: { query: searchQuery }
    });
  };

  const handlePackagePress = (pkg) => {
    setTripData({
      locationInfo: { name: pkg.name, coordinates: pkg.coordinates },
      budget: pkg.budget,
    });
    router.push('/create-trip/select-traveler');
  };

  const handlePopularPlacePress = (place) => {
    router.push({
      pathname: '/discover/place-detail',
      params: place
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180, zIndex: 0 }}>
        <LinearGradient
          colors={[theme === 'dark' ? colors.card : '#E0F7FA', 'transparent']}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} removeClippedSubviews={true}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY }] }]}>
          <Text style={[styles.title, { color: colors.text }]}>Discover</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            {userPreferences.length > 0
              ? `✨ Personalized for you based on past trips`
              : 'Find your next dream destination'}
          </Text>
        </Animated.View>

        {/* Search */}
        <Animated.View style={[styles.searchContainer, { opacity: fadeAnim, transform: [{ translateY }] }]}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search any destination..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleQuickTripSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.icon} />
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

        {/* Categories */}
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
                  { backgroundColor: selectedCategory === cat ? Colors.PRIMARY : colors.card },
                  selectedCategory !== cat && { borderWidth: 1, borderColor: colors.border }
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[
                  styles.categoryText,
                  { color: selectedCategory === cat ? '#fff' : colors.text }
                ]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Packages */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {userPreferences.length > 0 ? 'Recommended For You ✨' : 'Curated Packages ✈️'}
            </Text>
            {userPreferences.length > 0 && (
              <View style={[styles.prefBadge, { backgroundColor: theme === 'dark' ? 'rgba(52, 199, 89, 0.2)' : '#E8F5E9' }]}>
                <Ionicons name="sparkles" size={12} color={Colors.PRIMARY} />
                <Text style={styles.prefBadgeText}>AI Matched</Text>
              </View>
            )}
          </View>

          {loadingPrefs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.PRIMARY} />
              <Text style={[styles.loadingText, { color: colors.icon }]}>Analyzing your preferences...</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
              {filteredPackages.map((item, index) => (
                <PackageCard
                  key={item.id}
                  item={item}
                  index={index}
                  theme={theme}
                  colors={colors}
                  onPress={handlePackagePress}
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Places Grid */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }], marginTop: 25 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Destinations</Text>
          <View style={styles.grid}>
            {PopularPlaces.map((item) => (
              <PlaceCard
                key={item.id}
                item={item}
                colors={colors}
                onPress={handlePopularPlacePress}
              />
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
  categoryText: {
    fontFamily: 'outfit-medium',
    fontSize: 13,
    color: Colors.GRAY,
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