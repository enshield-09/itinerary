import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation, useRouter } from 'expo-router';
import moment from 'moment';
import { useContext, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { CreateTripContext } from '../../context/CreateTripContext';
import { useTheme } from '../../context/ThemeContext';

export default function ReviewTrip() {
  const { tripData /*, setTripData */ } = useContext(CreateTripContext);
  const navigation = useNavigation();
  const router = useRouter();
  const { colors, theme } = useTheme();

  useEffect(() => {
    // best-effort header options; swallow if unsupported
    try {
      navigation.setOptions({
        headerShown: true,
        headerTransparent: true,
        headerTitle: ''
      });
    } catch (e) {
      // ignore
    }
  }, [navigation]);

  // Defensive helpers
  const formatDate = (d) => {
    if (!d) return null;
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    return moment(dateObj).format('DD MMM');
  };

  const computeTotalDays = () => {
    if (tripData?.totalNoOfDays) return tripData.totalNoOfDays;
    if (tripData?.startDate && tripData?.endDate) {
      const start = new Date(tripData.startDate);
      const end = new Date(tripData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    }
    return null;
  };

  // Prepare attractions text (avoid rendering objects directly)
  const attractionsText = (() => {
    const list = tripData?.selectedAttractions || tripData?.attractions || [];
    if (!Array.isArray(list) || list.length === 0) return 'No attractions selected';
    if (typeof list[0] === 'object') {
      return list.map(item => item.title || item.name || JSON.stringify(item)).join(', ');
    }
    return list.join(', ');
  })();

  // Destination text safe
  const destinationText = tripData?.locationInfo?.name || 'Destination not selected';

  // Dates safe
  const startFormatted = formatDate(tripData?.startDate);
  const endFormatted = formatDate(tripData?.endDate);
  const datesText = startFormatted && endFormatted
    ? `${startFormatted} to ${endFormatted}`
    : (startFormatted || endFormatted) || 'Dates not selected';

  const totalDays = computeTotalDays();

  const onContinue = () => {
    // simple guard: require destination and dates
    if (!tripData?.locationInfo?.name) {
      alert('Please select a destination before continuing.');
      return;
    }
    if (!tripData?.startDate || !tripData?.endDate) {
      alert('Please select travel dates before continuing.');
      return;
    }
    // navigate to itinerary generation screen
    router.push('/create-trip/generate-trip');
  };

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background,
    }}>
      <ScrollView
        contentContainerStyle={{
          padding: 25,
          paddingTop: 75,
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{
          fontSize: 35,
          fontFamily: 'outfit-bold',
          marginTop: 25,
          color: colors.text
        }}>Review your Trip</Text>

        <View style={{ marginTop: 20 }}>
          <Text style={{
            fontFamily: 'outfit-medium',
            fontSize: 18,
            color: colors.icon
          }}>Before generating your trip, please review your selection</Text>

          {/* Destination */}
          <View style={{
            marginTop: 40,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 20
          }}>
            <Entypo name="location" size={40} color={Colors.PRIMARY} />
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: 'outfit',
                fontSize: 16,
                color: colors.icon
              }}>Destination</Text>
              <Text style={{
                fontFamily: 'outfit-medium',
                fontSize: 20,
                color: colors.text
              }}>{destinationText}</Text>
            </View>
          </View>

          {/* Date Info */}
          <View style={{
            marginTop: 30,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 20
          }}>
            <Ionicons name="calendar-number-outline" size={40} color={Colors.PRIMARY} />
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: 'outfit',
                fontSize: 16,
                color: colors.icon
              }}>Travel Date</Text>
              <Text style={{
                fontFamily: 'outfit-medium',
                fontSize: 20,
                color: colors.text
              }}>{datesText}</Text>

              {totalDays != null && (
                <Text style={{
                  fontFamily: 'outfit',
                  fontSize: 14,
                  marginTop: 4,
                  color: colors.icon
                }}>{`Total: ${totalDays} day${totalDays > 1 ? 's' : ''}`}</Text>
              )}
            </View>
          </View>

          {/* Travelers (if present) */}
          {tripData?.traveler && (
            <View style={{
              marginTop: 30,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 20
            }}>
              <FontAwesome6 name="person-walking-luggage" size={35} color={Colors.PRIMARY} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'outfit', fontSize: 16, color: colors.icon }}>Travelers</Text>
                <Text style={{ fontFamily: 'outfit-medium', fontSize: 20, color: colors.text }}>
                  {typeof tripData.traveler === 'string' ? tripData.traveler : (tripData.traveler.title || JSON.stringify(tripData.traveler))}
                </Text>
              </View>
            </View>
          )}

          {/* Budget (if present) */}
          {tripData?.budget && (
            <View style={{
              marginTop: 30,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 20
            }}>
              <Ionicons name="wallet-outline" size={40} color={Colors.PRIMARY} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'outfit', fontSize: 16, color: colors.icon }}>Budget</Text>
                <Text style={{ fontFamily: 'outfit-medium', fontSize: 20, color: colors.text }}>{tripData.budget?.title || 'Not selected'}</Text>
              </View>
            </View>
          )}

          {/* Attractions */}
          <View style={{
            marginTop: 30,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 20
          }}>
            <MaterialIcons name="attractions" size={40} color={Colors.PRIMARY} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'outfit', fontSize: 16, color: colors.icon }}>Attractions</Text>
              <Text style={{ fontFamily: 'outfit-medium', fontSize: 20, color: colors.text }}>
                {attractionsText}
              </Text>
            </View>
          </View>
        </View>

        {/* Continue button */}
        <TouchableOpacity
          onPress={onContinue}
          style={{
            padding: 18,
            backgroundColor: Colors.PRIMARY,
            borderRadius: 50,
            alignItems: 'center',
            marginTop: 50,
            marginBottom: 20,
            shadowColor: Colors.PRIMARY,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8
          }}
        >
          <Text style={{
            color: Colors.WHITE,
            fontFamily: 'outfit-bold',
            fontSize: 20,
          }}>Build My Trip
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
