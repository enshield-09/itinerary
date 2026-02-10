import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useContext, useEffect, useState } from 'react';
import { Animated, Easing, ImageBackground, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CreateTripContext } from './../../context/CreateTripContext';
import Colors from './../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

// Conditionally import GooglePlacesAutocomplete only on native platforms
let GooglePlacesAutocomplete = null;
if (Platform.OS !== 'web') {
  try {
    const module = require('react-native-google-places-autocomplete');
    GooglePlacesAutocomplete = module.GooglePlacesAutocomplete;
  } catch (e) {
    console.warn('GooglePlacesAutocomplete not available:', e);
  }
}

const RECENT_SEARCHES_KEY = 'recent_searches';

export default function SearchPlace() {
  const navigation = useNavigation();
  const router = useRouter();
  const { tripData, setTripData } = useContext(CreateTripContext);
  const { colors, theme } = useTheme();
  const [recentSearches, setRecentSearches] = useState([]);

  // Recommendations State
  const [recommendations, setRecommendations] = useState([]);
  const [showRecModal, setShowRecModal] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [selectedRecs, setSelectedRecs] = useState([]);
  const [pendingLocation, setPendingLocation] = useState(null); // Temp store while modal is open

  const bgImages = [
    require('./../../assets/images/tajmahal.jpg'),
    require('./../../assets/images/germany.jpg'),
    require('./../../assets/images/monaco.jpg'),
    require('./../../assets/images/australia.jpg'),
    require('./../../assets/images/switzerland.jpg'),
    require('./../../assets/images/paris.jpg'),
    require('./../../assets/images/newyork.jpg'),
    require('./../../assets/images/dubai.jpg'),
  ];

  const [bgIndex, setBgIndex] = useState(0);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (locationName) => {
    try {
      const updated = [locationName, ...recentSearches.filter(s => s !== locationName)].slice(0, 5);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const handleLocationSelect = (locationName, locationData) => {
    saveRecentSearch(locationName);
    setPendingLocation(locationData);

    // Trigger recommendations fetch
    fetchRecommendations(locationName);
  };

  const fetchRecommendations = async (locationName) => {
    setLoadingRecs(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.photos'
        },
        body: JSON.stringify({
          textQuery: `Top tourist attractions in ${locationName}`
        })
      });
      const result = await response.json();
      if (result.places) {
        // Take top 5
        setRecommendations(result.places.slice(0, 5));
        // Select top 3 by default
        setSelectedRecs(result.places.slice(0, 3).map(p => p.displayName.text));
        setShowRecModal(true);
      } else {
        // No results, just proceed
        proceedToNextStep();
      }
    } catch (e) {
      console.error("Failed to fetch recs:", e);
      proceedToNextStep();
    } finally {
      setLoadingRecs(false);
    }
  };

  const proceedToNextStep = (customAttractions = []) => {
    setShowRecModal(false);
    const location = pendingLocation || tripData.locationInfo; // Fallback

    if (!location) {
      router.push('/create-trip/select-origin');
      return;
    }

    setTripData(prev => ({
      ...prev,
      locationInfo: location,
      customAttractions: customAttractions
    }));

    setTimeout(() => {
      router.push('/create-trip/select-origin');
    }, 50);
  };

  const toggleRecSelection = (name) => {
    setSelectedRecs(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name);
      return [...prev, name];
    });
  };

  /* Animation Logic */
  const isFocused = useIsFocused();

  useEffect(() => {
    let interval;
    if (isFocused) {
      interval = setInterval(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true
        }).start(() => {
          setBgIndex((prev) => (prev + 1) % bgImages.length);

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true
          }).start();
        });
      }, 5000); // 5 sec is better than 3 sec to reduce frequent updates
    }

    return () => {
      if (interval) clearInterval(interval);
      // Cancel animations if unfocused? Not necessary as native driver handles it well, but pausing interval is key.
    };
  }, [isFocused]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: 'Search',
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontFamily: 'outfit-bold',
        fontSize: 24
      }
    });
  }, [navigation]);

  useEffect(() => {
    console.log('Current tripData in SearchPlace:', tripData);
  }, [tripData]);

  return (

    <View style={{ flex: 1 }}>
      {/* Background slideshow */}
      <Animated.View style={[styles.bgWrapper, { opacity: fadeAnim }]}>
        <ImageBackground
          source={bgImages[bgIndex]}
          style={styles.bg}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
      </Animated.View>

      {/* REAL SCREEN CONTENT */}
      <View style={styles.container}>
        {Platform.OS === 'web' ? (
          <View>
            <TextInput
              style={[styles.webInput, {
                backgroundColor: theme === 'dark' ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
                color: colors.text
              }]}
              placeholder="Search for a place (e.g., Paris, France)"
              placeholderTextColor={colors.icon}
              onChangeText={(text) => {
                // Store the text as user types
                if (text.length > 2) {
                  setTripData(prev => ({
                    ...prev,
                    locationInfo: {
                      name: text,
                      coordinates: null,
                      photoRef: null,
                      url: null
                    }
                  }));
                }
              }}
              onSubmitEditing={(e) => {
                const locationName = e.nativeEvent.text;
                if (locationName) {
                  handleLocationSelect(locationName, {
                    name: locationName,
                    coordinates: null,
                    photoRef: null,
                    url: null
                  });
                }
              }}
            />
            <TouchableOpacity
              style={[styles.webButton, { backgroundColor: Colors.PRIMARY }]}
              onPress={() => {
                const locationName = 'Paris, France'; // Default for demo
                handleLocationSelect(locationName, {
                  name: locationName,
                  coordinates: null,
                  photoRef: null,
                  url: null
                });
              }}
            >
              <Text style={styles.webButtonText}>Continue with Demo Location</Text>
            </TouchableOpacity>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ color: '#fff', fontSize: 16, marginBottom: 10, fontFamily: 'outfit-bold' }}>Recent Searches</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.recentSearchChip}
                      onPress={() => handleLocationSelect(search, {
                        name: search,
                        coordinates: null,
                        photoRef: null,
                        url: null
                      })}
                    >
                      <Text style={styles.recentSearchText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        ) : GooglePlacesAutocomplete ? (
          <GooglePlacesAutocomplete
            placeholder="Search Destination"
            fetchDetails={true}
            predefinedPlaces={[]}
            predefinedPlacesAlwaysVisible={false}
            minLength={2}
            timeout={20000}
            keyboardShouldPersistTaps="handled"
            query={{
              key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
              language: 'en'
            }}
            onPress={(data, details = null) => {
              console.log('Selected:', data, details);
              handleLocationSelect(data.description, {
                name: data.description,
                coordinates: details?.geometry.location,
                photoRef: details?.photos?.[0]?.photo_reference,
                url: details?.url
              });
            }}
            onFail={(error) => console.warn('Autocomplete error:', error)}
            onNotFound={() => console.log('No results found')}
            textInputProps={{
              onFocus: () => console.log('Input focused'),
              placeholderTextColor: colors.icon
            }}
            styles={{
              textInputContainer: {
                backgroundColor: theme === 'dark' ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
                borderRadius: 15,
                paddingHorizontal: 10,
                borderWidth: 0,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 5 },
                elevation: 5,
                alignItems: 'center',
                paddingVertical: 5
              },
              textInput: {
                height: 50,
                color: colors.text,
                fontSize: 18,
                fontFamily: 'outfit-medium',
                backgroundColor: 'transparent'
              },
              listView: {
                backgroundColor: colors.card,
                marginTop: 15,
                borderRadius: 15,
                overflow: 'hidden',
                padding: 5
              },
              row: {
                padding: 13,
                borderBottomWidth: 1,
                borderBottomColor: colors.border
              },
              description: {
                color: colors.text,
                fontFamily: 'outfit',
                fontSize: 15
              },
              poweredContainer: {
                display: 'none'
              }
            }}
          />
        ) : (
          <Text style={styles.errorText}>Google Places Autocomplete not available</Text>
        )}
      </View>

      {/* Recommendations Modal */}
      {showRecModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>✨ Suggested Add-ons</Text>
            <Text style={[styles.modalSubtitle, { color: colors.icon }]}>Popular places in {pendingLocation?.name || 'this location'}</Text>

            <ScrollView style={{ maxHeight: 300, marginVertical: 15 }}>
              {recommendations.map((place, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.recItem,
                    { backgroundColor: theme === 'dark' ? colors.background : '#f5f5f5', borderColor: 'transparent' },
                    selectedRecs.includes(place.displayName.text) && { backgroundColor: theme === 'dark' ? 'rgba(11, 102, 255, 0.2)' : '#e6f2ff', borderColor: Colors.PRIMARY }
                  ]}
                  onPress={() => toggleRecSelection(place.displayName.text)}
                >
                  <Text style={[
                    styles.recText,
                    { color: colors.text },
                    selectedRecs.includes(place.displayName.text) && { color: Colors.PRIMARY }
                  ]}>
                    {place.displayName.text}
                  </Text>
                  {selectedRecs.includes(place.displayName.text) && (
                    <Text style={{ fontSize: 18, color: Colors.PRIMARY }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: Colors.PRIMARY }]}
              onPress={() => proceedToNextStep(selectedRecs)}
            >
              <Text style={styles.modalButtonText}>Add Selection & Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => proceedToNextStep([])}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>

  );
}

const styles = StyleSheet.create({
  bgWrapper: {
    ...StyleSheet.absoluteFillObject
  },
  bg: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)'
  },
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 110
  },
  webInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 15,
    height: 55,
    color: '#111',
    fontSize: 18,
    fontFamily: 'outfit-medium',
    letterSpacing: 0.5,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  webButton: {
    marginTop: 15,
    backgroundColor: '#000',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center'
  },
  webButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'outfit-bold'
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'outfit'
  },
  recentSearchChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)'
  },
  recentSearchText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'outfit-medium'
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontFamily: 'outfit-bold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 5
  },
  modalSubtitle: {
    fontFamily: 'outfit',
    fontSize: 16,
    textAlign: 'center',
    color: Colors.GRAY,
    marginBottom: 10
  },
  recItem: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  recItemSelected: {
    backgroundColor: '#e6f2ff', // Light blue
    borderColor: Colors.PRIMARY
  },
  recText: {
    fontFamily: 'outfit-medium',
    fontSize: 16,
    color: '#333'
  },
  recTextSelected: {
    color: Colors.PRIMARY
  },
  modalButton: {
    backgroundColor: Colors.BLACK,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10
  },
  modalButtonText: {
    color: 'white',
    fontFamily: 'outfit-bold',
    fontSize: 16
  },
  skipButton: {
    marginTop: 15,
    alignItems: 'center'
  },
  skipButtonText: {
    fontFamily: 'outfit-medium',
    color: Colors.GRAY
  }
});


