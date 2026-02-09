import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState, useRef, useContext } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View, Image, Animated, Easing, TouchableOpacity, TextInput } from 'react-native';
import { db } from '../../configs/FirebaseConfig';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import EditTripItemModal from '../../components/TripDetails/EditTripItemModal';
import EditTripSettingsModal from '../../components/TripDetails/EditTripSettingsModal';
import { CreateTripContext } from '../../context/CreateTripContext';

// Fallback images
const FALLBACK_HOTEL = require('../../assets/images/hotel.jpg');
const FALLBACK_ACTIVITY = require('../../assets/images/cultural.jpg');

// Custom Network Image Component with Local Fallback + Overlay
const NetworkImage = ({ uri, fallback, style, resizeMode = 'cover' }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={[style, { overflow: 'hidden', backgroundColor: '#f0f0f0' }]}>
      {/* 1. Always show fallback first */}
      <Image
        source={fallback}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        resizeMode={resizeMode}
      />

      {/* 2. Overlay network image when loaded */}
      {uri && !error && (
        <Image
          source={{ uri }}
          style={[
            StyleSheet.absoluteFill,
            { width: '100%', height: '100%', opacity: loaded ? 1 : 0 }
          ]}
          resizeMode={resizeMode}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </View>
  );
};

export default function TripDetails() {
  const { docId } = useLocalSearchParams();
  const router = useRouter();
  const { setTripData } = useContext(CreateTripContext);
  const [tripDetails, setTripDetails] = useState(null);
  const [tripPlan, setTripPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState({});

  // Trip Notes State
  const [tripNotes, setTripNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // Data for item being edited
  const [itemType, setItemType] = useState('hotel'); // 'hotel' or 'activity'
  const [editIndex, setEditIndex] = useState(-1);
  const [editDayIndex, setEditDayIndex] = useState(-1);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Handle saving trip settings
  const handleSaveTripSettings = async (newSettings) => {
    try {
      // tripDetails is the parsed object already
      const currentTripData = tripDetails || {};

      const updatedTripData = {
        ...currentTripData,
        ...newSettings,
      };

      // Set context for AI Generation
      setTripData(updatedTripData);
      setSettingsModalVisible(false);

      // Navigate to regeneration screen
      router.push({
        pathname: '/create-trip/generate-trip',
        params: { docId: docId }
      });

    } catch (error) {
      console.error("Error updating trip settings:", error);
      Alert.alert("Error", "Failed to save settings");
    }
  };

  // Update Trip Plan in Firestore
  const updateTripPlan = async (newTripPlan) => {
    setTripPlan(newTripPlan); // Optimistic update
    try {
      await updateDoc(doc(db, "ItineraryApp", docId), {
        tripPlan: newTripPlan
      });
    } catch (error) {
      console.error("Error updating trip plan:", error);
      Alert.alert("Error", "Failed to save changes");
    }
  };

  const handleDeleteHotel = (index) => {
    Alert.alert("Delete Hotel", "Are you sure you want to remove this hotel?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedHotels = [...tripPlan.hotels];
          updatedHotels.splice(index, 1);
          const newTripPlan = { ...tripPlan, hotels: updatedHotels };
          updateTripPlan(newTripPlan);
        }
      }
    ]);
  };

  const handleDeleteActivity = (dayIndex, activityIndex) => {
    Alert.alert("Delete Activity", "Are you sure you want to remove this activity?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedDailyPlan = [...tripPlan.daily_plan];
          const behaviors = updatedDailyPlan[dayIndex];

          let updatedActivities;
          if (Array.isArray(behaviors.activities)) {
            updatedActivities = [...behaviors.activities];
            updatedActivities.splice(activityIndex, 1);
            updatedDailyPlan[dayIndex] = { ...behaviors, activities: updatedActivities };
          } else {
            // Handle case where activity might be single object (though we normalized it, safer to keep logic)
            updatedDailyPlan[dayIndex] = { ...behaviors, activities: [] };
          }

          const newTripPlan = { ...tripPlan, daily_plan: updatedDailyPlan };
          updateTripPlan(newTripPlan);
        }
      }
    ]);
  };

  // --- Edit & Add Handlers ---

  const handleEditHotel = (item, index) => {
    setEditingItem(item);
    setItemType('hotel');
    setEditIndex(index);
    setModalVisible(true);
  };

  const handleAddHotel = () => {
    setEditingItem(null); // Empty for add
    setItemType('hotel');
    setModalVisible(true);
  };

  const handleEditActivity = (item, dayIndex, activityIndex) => {
    setEditingItem(item);
    setItemType('activity');
    setEditDayIndex(dayIndex);
    setEditIndex(activityIndex);
    setModalVisible(true);
  };

  const handleAddActivity = (dayIndex) => {
    setEditingItem(null);
    setItemType('activity');
    setEditDayIndex(dayIndex);
    setModalVisible(true);
  };

  const handleSaveItem = (data) => {
    let newTripPlan = { ...tripPlan };

    if (itemType === 'hotel') {
      const updatedHotels = [...(newTripPlan.hotels || [])];
      if (editingItem) {
        // Edit existing
        updatedHotels[editIndex] = { ...updatedHotels[editIndex], ...data };
      } else {
        // Add new
        updatedHotels.push(data);
      }
      newTripPlan.hotels = updatedHotels;
    } else {
      // Activity
      const updatedDailyPlan = [...newTripPlan.daily_plan];
      const day = updatedDailyPlan[editDayIndex];
      let activities = Array.isArray(day.activities) ? [...day.activities] : [];

      if (editingItem) {
        activities[editIndex] = { ...activities[editIndex], ...data };
      } else {
        activities.push(data);
      }

      updatedDailyPlan[editDayIndex] = { ...day, activities };
      newTripPlan.daily_plan = updatedDailyPlan;
    }

    updateTripPlan(newTripPlan);

    // Fetch image for new item if needed
    // Fetch image for new item if needed OR if image changed
    if (data.image_url) {
      setImages(prev => ({ ...prev, [data.name]: data.image_url }));
    } else if (!editingItem && data.name) {
      fetchPlaceImage(data.name, locationName).then(url => {
        if (url) setImages(prev => ({ ...prev, [data.name]: url }));
      });
    }
  };

  // Fetch Place Photo from Google Places API
  const fetchPlaceImage = async (placeName, locationName) => {
    try {
      const query = `${placeName} ${locationName}`;
      const url = `https://places.googleapis.com/v1/places:searchText`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.photos',
        },
        body: JSON.stringify({ textQuery: query })
      });

      const result = await response.json();

      if (result.places && result.places.length > 0 && result.places[0].photos) {
        const photoReference = result.places[0].photos[0].name;
        const photoUrl = `https://places.googleapis.com/v1/${photoReference}/media?maxHeightPx=800&maxWidthPx=800&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`;
        return photoUrl;
      }
    } catch (error) {
      console.log("Error fetching image:", error);
    }
    return null;
  };

  const isValidImageUrlFormat = (url) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png)$/) != null || url.includes('places.googleapis.com');
  };

  useEffect(() => {
    if (!docId) return;

    setLoading(true);
    const docRef = doc(db, "ItineraryApp", docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        let parsedTripPlan = data.tripPlan;
        let parsedTripData = data.tripData;

        // Handle stringified JSON if necessary
        if (typeof parsedTripPlan === 'string') {
          try { parsedTripPlan = JSON.parse(parsedTripPlan); } catch (e) { console.error("Error parsing tripPlan", e); }
        }
        if (typeof parsedTripData === 'string') {
          try { parsedTripData = JSON.parse(parsedTripData); } catch (e) { console.error("Error parsing tripData", e); }
        }

        // Normalize structure
        if (parsedTripPlan?.travel_plan) {
          parsedTripPlan = parsedTripPlan.travel_plan;
        }

        setTripDetails(parsedTripData);
        setTripPlan(parsedTripPlan);
        setTripNotes(data.tripNotes || '');

        // Load images (only if haven't loaded yet or completely new plan)
        // We can check if images are empty or simple logic: just load.
        // loadImages checks if image exists in state before fetching usually?
        // Let's just call it, it handles keys.
        loadImages(parsedTripPlan, parsedTripData);

        // Run animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic)
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic)
          })
        ]).start();

        setLoading(false);
      } else {
        Alert.alert("Error", "No such trip found!");
        router.back();
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching trip details:", error);
      Alert.alert("Error", "Failed to load trip details");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [docId]);

  // Removed GetTripDetails function as logic is now in useEffect
  /* 
  const GetTripDetails = async () => { ... } 
  */



  const loadImages = async (tripPlan, parsedData) => {
    const location = parsedData?.locationInfo?.name || tripPlan.location || '';
    const hotels = tripPlan.hotels || [];
    const days = tripPlan.daily_plan || [];

    console.log('=== Starting image load ===');
    console.log('Location:', location);

    // ALWAYS fetch from Google Places - never trust AI URLs
    for (const hotel of hotels) {
      if (!hotel.name) continue;
      try {
        const url = await fetchPlaceImage(hotel.name, location);
        if (url) {
          setImages(prev => ({ ...prev, [hotel.name]: url }));
        }
      } catch (e) {
        console.error('Hotel image error:', hotel.name, e.message);
      }
    }

    // Activities
    for (const day of days) {
      const activities = Array.isArray(day.activities) ? day.activities : [day];
      for (const activity of activities) {
        if (!activity?.name) continue;
        try {
          const url = await fetchPlaceImage(activity.name, location);
          if (url) {
            setImages(prev => ({ ...prev, [activity.name]: url }));
          }
        } catch (e) {
          console.error('Activity image error:', activity.name, e.message);
        }
      }
    }
  };

  const saveTripNotes = async () => {
    setSavingNotes(true);
    try {
      await updateDoc(doc(db, 'ItineraryApp', docId.toString()), { tripNotes });
      setShowNotesInput(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const openLink = (url) => {
    if (url) Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const generateHotelBookingUrl = (hotelName, location) => {
    return `https://www.google.com/travel/hotels?q=${encodeURIComponent(hotelName + ' ' + location)}`;
  };

  const generateFlightBookingUrl = (destination) => {
    return `https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(destination)}`;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.WHITE }}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  }

  const { locationInfo, startDate, endDate, traveler, budget } = tripDetails || {};
  const locationName = locationInfo?.name || tripPlan?.location || "Unknown Location";

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>

      {/* Decorative Gradient Background */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 250, zIndex: 0 }}>
        <LinearGradient
          colors={[Colors.PRIMARY + '20', 'transparent']}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header Image */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.imageContainer}>
            <NetworkImage
              uri={locationInfo?.photoRef ? `https://places.googleapis.com/v1/${locationInfo.photoRef}/media?maxHeightPx=800&maxWidthPx=800&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}` : null}
              fallback={require('../../assets/images/paris.jpg')}
              style={styles.mainImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
            />
            <View style={styles.headerContent}>
              <Text style={styles.locationTitle}>{locationName}</Text>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>
                  {startDate ? new Date(startDate).toLocaleDateString() : 'Date TBD'} - {tripPlan?.duration}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons name={isEditing ? "checkmark-circle" : "create-outline"} size={26} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => router.push({
                pathname: '/trip-details/map-view',
                params: { tripPlan: JSON.stringify(tripPlan) }
              })}
            >
              <Ionicons name="map" size={26} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
          <View style={styles.contentContainer}>

            {/* Trip Info Cards - Tappable to edit settings */}
            <View style={styles.infoRow}>
              <TouchableOpacity
                style={styles.infoCard}
                onPress={() => setSettingsModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.infoLabel}>Traveler</Text>
                <Text style={styles.infoValue}>{typeof traveler === 'object' ? traveler?.title : (traveler || 'Solo')}</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.GRAY} style={{ position: 'absolute', right: 8, top: 8 }} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.infoCard}
                onPress={() => setSettingsModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.infoLabel}>Budget</Text>
                <Text style={styles.infoValue}>{typeof budget === 'object' ? budget?.title : (budget || 'Moderate')}</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.GRAY} style={{ position: 'absolute', right: 8, top: 8 }} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.infoCard, styles.flightCard]}
                onPress={() => openLink(generateFlightBookingUrl(locationName))}
              >
                <Ionicons name="airplane-outline" size={20} color={Colors.PRIMARY} />
                <Text style={[styles.infoLabel, { color: Colors.PRIMARY, marginTop: 5 }]}>Flights</Text>
              </TouchableOpacity>
            </View>

            {/* Trip Notes Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trip Notes</Text>
                <TouchableOpacity onPress={() => setShowNotesInput(!showNotesInput)}>
                  <Ionicons name={showNotesInput ? "close-circle" : "create-outline"} size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
              </View>

              {showNotesInput ? (
                <View style={styles.notesEditor}>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Add important notes, reminders, or details..."
                    multiline
                    numberOfLines={4}
                    value={tripNotes}
                    onChangeText={setTripNotes}
                  />
                  <TouchableOpacity style={styles.saveButton} onPress={saveTripNotes} disabled={savingNotes}>
                    <Text style={styles.saveButtonText}>{savingNotes ? 'Saving...' : 'Save Notes'}</Text>
                  </TouchableOpacity>
                </View>
              ) : tripNotes ? (
                <Text style={styles.notesText}>{tripNotes}</Text>
              ) : (
                <Text style={styles.emptyNotesText}>No notes added yet. Tap icon to add.</Text>
              )}
            </View>

            {/* Hotels Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Where to Stay</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {tripPlan?.hotels?.map((item, index) => (
                  <View key={index} style={{ position: 'relative' }}>
                    <TouchableOpacity
                      style={styles.hotelCard}
                      onPress={() => isEditing ? handleEditHotel(item, index) : openLink(generateHotelBookingUrl(item.name, locationName))}
                      activeOpacity={0.9}
                    >
                      <NetworkImage
                        uri={images[item.name]}
                        fallback={FALLBACK_HOTEL}
                        style={styles.hotelImage}
                      />
                      <View style={styles.hotelInfo}>
                        <Text style={styles.hotelName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
                          <Text style={styles.priceText}>• {item.price_per_night || item.price || 'Price TBD'}</Text>
                        </View>
                        <Text style={styles.hotelAddress} numberOfLines={2}>{item.address || item.description}</Text>
                      </View>
                      {isEditing && (
                        <View style={styles.editOverlay}>
                          <Ionicons name="create" size={20} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                    {isEditing && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteHotel(index)}
                      >
                        <Ionicons name="trash" size={18} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {isEditing && (
                  <TouchableOpacity style={styles.addNewCard} onPress={handleAddHotel}>
                    <Ionicons name="add-circle" size={40} color={Colors.PRIMARY} />
                    <Text style={styles.addNewText}>Add Hotel</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            {/* Itinerary Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Itinerary</Text>
              {tripPlan?.daily_plan?.map((item, index) => (
                <View key={index} style={styles.dayContainer}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayText}>DAY {index + 1}</Text>
                  </View>

                  {/* Handle simple array of strings or array of objects */}
                  {(Array.isArray(item.activities) ? item.activities : [item]).map((activity, idx) => {
                    // If activity is just a string? (rare with this prompt but safely handle)
                    const actName = typeof activity === 'string' ? activity : activity.name;
                    const actDesc = typeof activity === 'string' ? '' : activity.description;
                    const actTime = typeof activity === 'string' ? '' : (activity.time || 'Flexible');

                    if (!actName) return null;

                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={isEditing ? 0.7 : 1}
                        onPress={() => isEditing && handleEditActivity(activity, index, idx)}
                      >
                        <View style={styles.activityCard}>
                          <NetworkImage
                            uri={images[actName]}
                            fallback={FALLBACK_ACTIVITY}
                            style={styles.activityImage}
                          />
                          <View style={styles.activityContent}>
                            <Text style={styles.activityName}>{actName}</Text>
                            <Text style={styles.activityDesc} numberOfLines={2}>{actDesc}</Text>

                            <View style={styles.activityMeta}>
                              <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={12} color={Colors.GRAY} />
                                <Text style={styles.metaText}>{actTime}</Text>
                              </View>
                              {activity.ticket_price && (
                                <View style={styles.metaItem}>
                                  <Ionicons name="pricetag-outline" size={12} color={Colors.GRAY} />
                                  <Text style={styles.metaText}>{activity.ticket_price}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          {isEditing && (
                            <>
                              <View style={styles.editBadge}>
                                <Ionicons name="pencil" size={14} color="white" />
                              </View>
                              <TouchableOpacity
                                style={styles.deleteActivityButton}
                                onPress={() => handleDeleteActivity(index, idx)}
                              >
                                <Ionicons name="trash" size={20} color={Colors.RED} />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {isEditing && (
                    <TouchableOpacity style={styles.addActivityButton} onPress={() => handleAddActivity(index)}>
                      <Ionicons name="add" size={20} color={Colors.PRIMARY} />
                      <Text style={styles.addActivityText}>Add Activity</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

          </View>
        </Animated.View>

      </ScrollView>

      <EditTripItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveItem}
        initialData={editingItem}
        type={itemType}
      />

      <EditTripSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        onSave={handleSaveTripSettings}
        tripData={tripDetails?.tripData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    height: 380, // Taller, full bleed header
    width: '100%',
    position: 'relative',
    borderBottomLeftRadius: 30, // Modern curve
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)', // Glassy back button
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10
  },
  editButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10
  },
  mapButton: {
    position: 'absolute',
    top: 50,
    right: 70, // Left of Edit button
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10
  },
  headerContent: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  locationTitle: {
    fontSize: 28, // Scaled down slightly for better fit
    fontFamily: 'outfit-bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  dateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dateText: {
    color: '#fff',
    fontFamily: 'outfit',
    fontSize: 14,
  },
  contentContainer: {
    padding: 20,
    marginTop: 0, // No negative margin needed with new header design
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  flightCard: {
    backgroundColor: '#ebf5ff',
    borderWidth: 1,
    borderColor: '#cce5ff',
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'outfit',
    color: Colors.GRAY,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'outfit-bold',
    color: Colors.BLACK,
    marginTop: 4,
    textAlign: 'center'
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'outfit-bold',
    color: Colors.BLACK,
    marginBottom: 15,
  },
  notesText: {
    fontSize: 15,
    fontFamily: 'outfit',
    color: '#444',
    lineHeight: 22,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1, // Subtle border
    borderColor: '#eee',
  },
  emptyNotesText: {
    fontSize: 14,
    fontFamily: 'outfit-medium',
    color: Colors.GRAY,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  notesEditor: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  notesInput: {
    fontFamily: 'outfit',
    fontSize: 15,
    color: Colors.BLACK,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: 'outfit-bold',
    fontSize: 14,
  },
  hotelCard: {
    width: 220, // Slightly wider
    marginRight: 15,
    borderRadius: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10, // For shadow
  },
  hotelImage: {
    width: '100%',
    height: 140, // Taller image
  },
  hotelInfo: {
    padding: 12,
  },
  hotelName: {
    fontSize: 16,
    fontFamily: 'outfit-medium',
    color: Colors.BLACK,
    marginBottom: 5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    fontFamily: 'outfit-medium',
    fontSize: 13,
    marginLeft: 4,
    color: Colors.BLACK
  },
  priceText: {
    fontFamily: 'outfit',
    fontSize: 13,
    color: Colors.GRAY,
    marginLeft: 4
  },
  hotelAddress: {
    fontSize: 12,
    fontFamily: 'outfit',
    color: Colors.GRAY,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 25, // Adjusted for card margin
    backgroundColor: Colors.RED,
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10
  },
  editOverlay: {
    position: 'absolute',
    top: '40%',
    left: '40%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 25,
  },
  addNewCard: {
    width: 220,
    height: 250,
    backgroundColor: '#ebf5ff',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    borderStyle: 'dashed'
  },
  addNewText: {
    fontSize: 16,
    fontFamily: 'outfit-medium',
    color: Colors.PRIMARY,
    marginTop: 10
  },
  dayContainer: {
    marginBottom: 25,
  },
  dayBadge: {
    backgroundColor: '#eee',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20, // Pill shape
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  dayText: {
    fontFamily: 'outfit-medium',
    fontSize: 14,
    color: Colors.BLACK,
    letterSpacing: 1
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  deleteActivityButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityImage: {
    width: 110, // Square-ish thumbnail
    height: '100%',
  },
  activityContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center'
  },
  activityName: {
    fontSize: 16,
    fontFamily: 'outfit-bold',
    color: Colors.BLACK,
    marginBottom: 5,
  },
  activityDesc: {
    fontSize: 13,
    fontFamily: 'outfit',
    color: Colors.GRAY,
    marginBottom: 8,
    lineHeight: 18
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  editBadge: {
    padding: 5,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 5,
    marginRight: 5
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderStyle: 'dashed',
    gap: 5
  },
  addActivityText: {
    fontFamily: 'outfit-medium',
    color: Colors.PRIMARY,
    fontSize: 14
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    fontFamily: 'outfit',
    fontSize: 11, // Small detail text
    color: Colors.GRAY,
    marginLeft: 4,
  }
});
