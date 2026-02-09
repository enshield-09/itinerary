import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import moment from 'moment';
import { useState, useMemo } from 'react';
import { Text, TouchableOpacity, View, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import UserTripCard from '../../components/MyTrips/UserTripCard';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');
const API_KEY = 'AIzaSyBNiTVqT-LJpDzl5i2WlVuYtUsK8yMF7Oc';

export default function UserTripList({ userTrips, onDeleteTrip, headerComponent, refreshing, onRefresh }) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  // ... (rest of the component)

  // ...

  // 2. Optimization: Use FlatList with ViewabilityConfig and remove ScrollView
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={parsedTrips}
        keyExtractor={(item) => item.docId}
        renderItem={({ item, index }) => (
          <UserTripCard
            trip={item}
            index={index}
            onDelete={onDeleteTrip ? () => onDeleteTrip(item.docId) : null}
            onPress={() => router.push({ pathname: '/trip-details', params: { docId: item.docId } })}
          />
        )}
        ListHeaderComponent={
          <>
            {headerComponent}
            {renderFeaturedTrip()}
          </>
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        windowSize={5}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}
