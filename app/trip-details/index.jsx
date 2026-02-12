import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState, useRef, useContext } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View, Animated, Easing, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { db } from '../../configs/FirebaseConfig';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import EditTripItemModal from '../../components/TripDetails/EditTripItemModal';
import EditTripSettingsModal from '../../components/TripDetails/EditTripSettingsModal';
import { CreateTripContext } from '../../context/CreateTripContext';
import { Image } from 'expo-image';
import { useTheme } from '../../context/ThemeContext';

// Fallback images
const FALLBACK_HOTEL = require('../../assets/images/hotel.jpg');
const FALLBACK_ACTIVITY = require('../../assets/images/cultural.jpg');

// Optimized Network Image Component
const NetworkImage = ({ uri, fallback, style, contentFit = 'cover' }) => {
  return (
    <View style={[style, { overflow: 'hidden', backgroundColor: '#f0f0f0' }]}>
      <Image
        source={uri ? { uri } : fallback}
        placeholder={fallback}
        style={{ width: '100%', height: '100%' }}
        contentFit={contentFit}
        transition={200}
        cachePolicy="memory-disk"
      />
    </View>
  );
};

export default function TripDetails() {
  const { docId } = useLocalSearchParams();
  const router = useRouter();
  const { setTripData } = useContext(CreateTripContext);
  const { colors } = useTheme();

  // Data State
  const [tripDetails, setTripDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState({}); // Cache for place images { name: url }

  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemType, setItemType] = useState(''); // 'hotel' or 'activity'
  const [editingItem, setEditingItem] = useState(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Notes State
  const [tripNotes, setTripNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  // Load Trip details
  useEffect(() => {
    if (docId) {
      GetTripDetails();
    }
  }, [docId]);

  const GetTripDetails = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'ItineraryApp', docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        let parsedData = data.tripData;
        if (typeof parsedData === 'string') {
          parsedData = JSON.parse(parsedData);
        }
        setTripDetails({ ...data, tripData: parsedData });
        setTripNotes(data.tripNotes || '');

        // Start Animations
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true })
        ]).start();

        // Fetch images (simplified placeholders for now, would use Places API in production)
        // Leaving logic here if needed later
      } else {
        Alert.alert("Error", "No such trip found!");
        router.back();
      }
    } catch (error) {
      console.log("Error fetching trip details:", error);
      Alert.alert("Error", "Failed to load trip details.");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const openLink = (url) => { if (url) Linking.openURL(url); };
  const generateFlightBookingUrl = (dest) => `https://www.google.com/travel/flights?tfs=${dest}`;
  const generateHotelBookingUrl = (hotel, loc) => `https://www.google.com/travel/hotels?q=${hotel}+in+${loc}`;

  // Actions
  const saveTripNotes = async () => {
    if (!docId) return;
    setSavingNotes(true);
    try {
      await updateDoc(doc(db, 'ItineraryApp', docId), { tripNotes: tripNotes });
      setShowNotesInput(false);
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleEditHotel = (item, index) => {
    setEditingItem({ item, index, type: 'hotel' });
    setItemType('hotel');
    setModalVisible(true);
  };

  const handleDeleteHotel = (index) => {
    Alert.alert("Delete Hotel", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: 'destructive', onPress: async () => {
          const newHotels = [...tripDetails.tripData.hotels];
          newHotels.splice(index, 1);
          await updateTripData({ ...tripDetails.tripData, hotels: newHotels });
        }
      }
    ]);
  };

  const handleAddHotel = () => {
    setEditingItem({ index: tripDetails?.tripData?.hotels?.length || 0, type: 'hotel', isNew: true });
    setItemType('hotel');
    setModalVisible(true);
  };

  const handleEditActivity = (activity, dayIndex, activityIndex) => {
    setEditingItem({ item: activity, dayIndex, index: activityIndex, type: 'activity' });
    setItemType('activity');
    setModalVisible(true);
  };

  const handleDeleteActivity = (dayIndex, activityIndex) => {
    // Implement delete logic here if needed
    // Require complex state update for daily_plan array
  };

  const handleAddActivity = (dayIndex) => {
    setEditingItem({ dayIndex, type: 'activity', isNew: true });
    setItemType('activity');
    setModalVisible(true);
  };

  const updateTripData = async (newTripData) => {
    await updateDoc(doc(db, 'ItineraryApp', docId), { tripData: JSON.stringify(newTripData) });
    setTripDetails(prev => ({ ...prev, tripData: newTripData }));
  };

  const handleSaveItem = async (updatedItem, isNew) => {
    // Logic to update state and firestore based on itemType 'hotel' or 'activity'
    // Simplified for this optimization pass: Reload or local update required
    // For now, refreshing trip details
    GetTripDetails();
    setModalVisible(false);
  };

  const handleSaveTripSettings = async (newSettings) => {
    // Logic for saving settings
    setSettingsModalVisible(false);
    GetTripDetails();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  }

  // Handle different JSON structures (some AI models wrap in travel_plan/trip_plan)
  // Priority: 1. tripPlan field (AI Output), 2. tripData field (Legacy/Fallback)
  const sourceData = tripDetails?.tripPlan || tripDetails?.tripData;
  const tripPlan = sourceData?.travel_plan || sourceData?.trip_plan || sourceData;
  const { locationInfo, startDate, traveler, budget } = tripDetails || {};
  const locationName = locationInfo?.name || tripPlan?.location || "Unknown Location";

  // Render Header (Info, Notes, Hotels)
  const renderHeader = () => (
    <View>
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.imageContainer}>
          <NetworkImage
            uri={locationInfo?.photoRef ? `https://places.googleapis.com/v1/${locationInfo.photoRef}/media?maxHeightPx=800&maxWidthPx=800&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}` : null}
            fallback={require('../../assets/images/paris.jpg')}
            style={styles.mainImage}
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.imageOverlay} />
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
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
            <Ionicons name={isEditing ? "checkmark-circle" : "create-outline"} size={26} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapButton} onPress={() => router.push({ pathname: '/trip-details/map-view', params: { tripPlan: JSON.stringify(tripPlan) } })}>
            <Ionicons name="map" size={26} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
        <View style={styles.contentContainer}>
          {/* Info Cards */}
          <View style={styles.infoRow}>
            <TouchableOpacity style={[styles.infoCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => setSettingsModalVisible(true)}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Traveler</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{typeof traveler === 'object' ? traveler?.title : (traveler || 'Solo')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.infoCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => setSettingsModalVisible(true)}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Budget</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{typeof budget === 'object' ? budget?.title : (budget || 'Moderate')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.infoCard, styles.flightCard, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => openLink(generateFlightBookingUrl(locationName))}>
              <Ionicons name="airplane-outline" size={20} color={Colors.PRIMARY} />
              <Text style={[styles.infoLabel, { color: Colors.PRIMARY, marginTop: 5 }]}>Flights</Text>
            </TouchableOpacity>
          </View>

          {/* Trip Notes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Trip Notes</Text>
              <TouchableOpacity onPress={() => setShowNotesInput(!showNotesInput)}>
                <Ionicons name={showNotesInput ? "close-circle" : "create-outline"} size={24} color={Colors.PRIMARY} />
              </TouchableOpacity>
            </View>
            {showNotesInput ? (
              <View style={[styles.notesEditor, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                <TextInput
                  style={[styles.notesInput, { color: colors.text }]}
                  placeholder="Add important notes..."
                  placeholderTextColor={colors.icon}
                  multiline
                  value={tripNotes}
                  onChangeText={setTripNotes}
                />
                <TouchableOpacity style={styles.saveButton} onPress={saveTripNotes} disabled={savingNotes}>
                  <Text style={styles.saveButtonText}>{savingNotes ? 'Saving...' : 'Save Notes'}</Text>
                </TouchableOpacity>
              </View>
            ) : tripNotes ? (
              <Text style={[styles.notesText, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}>{tripNotes}</Text>
            ) : (
              <Text style={[styles.emptyNotesText, { color: colors.icon }]}>No notes added yet.</Text>
            )}
          </View>

          {/* Hotels - Horizontal Scroll inside Header */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Where to Stay</Text>
            <FlatList
              horizontal
              data={tripPlan?.hotels || []}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
              renderItem={({ item, index }) => (
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    style={[styles.hotelCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
                    onPress={() => isEditing ? handleEditHotel(item, index) : openLink(generateHotelBookingUrl(item.name, locationName))}
                    activeOpacity={0.9}
                  >
                    <NetworkImage
                      uri={images[item.name]}
                      fallback={FALLBACK_HOTEL}
                      style={styles.hotelImage}
                    />
                    <View style={styles.hotelInfo}>
                      <Text style={[styles.hotelName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.ratingText, { color: colors.text }]}>⭐ {item.rating || '4.5'}</Text>
                    </View>
                    {isEditing && (
                      <View style={styles.editOverlay}><Ionicons name="create" size={20} color="white" /></View>
                    )}
                  </TouchableOpacity>
                  {isEditing && (
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteHotel(index)}>
                      <Ionicons name="trash" size={18} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              ListFooterComponent={isEditing ? (
                <TouchableOpacity style={[styles.addNewCard, { backgroundColor: colors.card, borderColor: Colors.PRIMARY }]} onPress={handleAddHotel}>
                  <Ionicons name="add-circle" size={40} color={Colors.PRIMARY} />
                  <Text style={styles.addNewText}>Add Hotel</Text>
                </TouchableOpacity>
              ) : null}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>Daily Itinerary</Text>
        </View>
      </Animated.View>
    </View>
  );

  // Render Day Item for Vertical FlatList
  const renderDayItem = ({ item, index }) => (
    <View style={[styles.dayContainer, { marginHorizontal: 20 }]}>
      <View style={[styles.dayBadge, { backgroundColor: colors.border }]}>
        <Text style={[styles.dayText, { color: colors.text }]}>DAY {index + 1}</Text>
      </View>

      {(Array.isArray(item.activities) ? item.activities : [item]).map((activity, idx) => {
        const actName = typeof activity === 'string' ? activity : activity.name;
        const actDesc = typeof activity === 'string' ? '' : activity.description;
        const actTime = typeof activity === 'string' ? '' : (activity.time || 'Flexible');
        if (!actName) return null;

        return (
          <TouchableOpacity key={idx} activeOpacity={isEditing ? 0.7 : 1} onPress={() => isEditing && handleEditActivity(activity, index, idx)}>
            <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
              <NetworkImage
                uri={images[actName]}
                fallback={FALLBACK_ACTIVITY}
                style={styles.activityImage}
              />
              <View style={styles.activityContent}>
                <Text style={[styles.activityName, { color: colors.text }]}>{actName}</Text>
                <Text style={[styles.activityDesc, { color: colors.icon }]} numberOfLines={2}>{actDesc}</Text>
                <View style={styles.activityMeta}>
                  <View style={[styles.metaItem, { backgroundColor: colors.border }]}>
                    <Ionicons name="time-outline" size={12} color={colors.icon} />
                    <Text style={[styles.metaText, { color: colors.icon }]}>{actTime}</Text>
                  </View>
                </View>
              </View>
              {isEditing && (
                <View style={{ position: 'absolute', right: 10, top: 10, flexDirection: 'row', gap: 10 }}>
                  <Ionicons name="pencil" size={16} color={Colors.PRIMARY} />
                  <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDeleteActivity(index, idx); }}>
                    <Ionicons name="trash" size={18} color={Colors.RED} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {isEditing && (
        <TouchableOpacity style={[styles.addActivityButton, { backgroundColor: colors.card }]} onPress={() => handleAddActivity(index)}>
          <Ionicons name="add" size={20} color={Colors.PRIMARY} />
          <Text style={styles.addActivityText}>Add Activity</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 250, zIndex: 0 }}>
        <LinearGradient colors={[Colors.PRIMARY + '20', 'transparent']} style={{ width: '100%', height: '100%' }} />
      </View>

      <FlatList
        data={tripPlan?.daily_plan || []}
        renderItem={renderDayItem}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
      />

      {/* Modals */}
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
    height: 380,
    width: '100%',
    position: 'relative',
    borderBottomLeftRadius: 30,
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
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    right: 70,
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
    fontSize: 28,
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
    marginTop: 0,
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
    borderWidth: 1,
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
    width: 220,
    marginRight: 15,
    borderRadius: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  hotelImage: {
    width: '100%',
    height: 140,
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
  ratingText: {
    fontFamily: 'outfit-medium',
    fontSize: 13,
    marginLeft: 4,
    color: Colors.BLACK
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 25,
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
    borderRadius: 20,
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
  activityImage: {
    width: 110,
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
    fontSize: 11,
    color: Colors.GRAY,
    marginLeft: 4,
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
  }
});
