import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { Text, TouchableOpacity, View, Image } from 'react-native';
import { useState } from 'react';
import Colors from '../../constants/Colors';

const API_KEY = 'AIzaSyBNiTVqT-LJpDzl5i2WlVuYtUsK8yMF7Oc';

export default function UserTripCard({ trip, onDelete, index = 0 }) {
  const [imageError, setImageError] = useState(false);

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
    <View style={{
      marginTop: 15,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 12,
      borderRadius: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2
    }}>
      <View style={{
        width: 75,
        height: 75,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#e8e8e8'
      }}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 75, height: 75 }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Image
            source={require('../../assets/images/dubai.jpg')}
            style={{ width: 75, height: 75 }}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={{ marginLeft: 15, flex: 1 }}>
        <Text style={{
          fontFamily: 'outfit-bold',
          fontSize: 16,
          color: Colors.BLACK
        }} numberOfLines={1}>
          {locationName}
        </Text>
        <Text style={{
          fontFamily: 'outfit',
          fontSize: 13,
          color: Colors.GRAY,
          marginTop: 4
        }}>
          {startDate ? moment(startDate).format('DD MMM YYYY') : 'Date TBD'}
        </Text>
        <Text style={{
          fontFamily: 'outfit',
          fontSize: 12,
          color: Colors.GRAY,
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
    </View>
  );
}
