import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import Colors from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export default function UserTripCard({ trip, onDelete, index = 0, onPress }) {
  const [imageError, setImageError] = useState(false);
  const { colors } = useTheme();

  if (!trip || !trip.tripData) return null;

  // Optimize: Use parent's parsed data if available to avoid re-parsing
  const parsedData = trip.parsedData || (typeof trip.tripData === 'string' ? JSON.parse(trip.tripData) : trip.tripData);

  const { locationInfo, startDate, traveler } = parsedData;
  const photoRef = locationInfo?.photoRef;
  const locationName = locationInfo?.name || trip.tripPlan?.location || 'No location available';

  // Build the image URL directly from photoRef
  const imageUrl = photoRef && !imageError
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${API_KEY}`
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        marginTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 12,
        borderRadius: 15,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.border
      }}
    >
      <View style={{
        width: 75,
        height: 75,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: colors.border
      }}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 75, height: 75 }}
            contentFit="cover"
            transition={200}
            onError={() => setImageError(true)}
          />
        ) : (
          <Image
            source={require('../../assets/images/dubai.jpg')}
            style={{ width: 75, height: 75 }}
            contentFit="cover"
          />
        )}
      </View>

      <View style={{ marginLeft: 15, flex: 1 }}>
        <Text style={{
          fontFamily: 'outfit-bold',
          fontSize: 16,
          color: colors.text
        }} numberOfLines={1}>
          {locationName}
        </Text>
        <Text style={{
          fontFamily: 'outfit',
          fontSize: 13,
          color: colors.icon,
          marginTop: 4
        }}>
          {startDate ? moment(startDate).format('DD MMM YYYY') : 'Date TBD'}
        </Text>
        <Text style={{
          fontFamily: 'outfit',
          fontSize: 12,
          color: colors.icon,
          marginTop: 2
        }}>
          {typeof traveler === 'object' ? traveler?.title : traveler}
        </Text>
      </View>

      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={{ padding: 8 }}>
          <Ionicons name="trash-outline" size={20} color={Colors.RED} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
