import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

export default function StartNewTripCard() {
    const router = useRouter();
    return (
        <View style={{
            padding: 25,
            marginTop: 50,
            alignItems: 'center',
            gap: 20,
            backgroundColor: '#fff',
            borderRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
            marginHorizontal: 10
        }}>
            <View style={{
                backgroundColor: Colors.LIGHT_BLUE,
                padding: 15,
                borderRadius: 40
            }}>
                <Ionicons name="location" size={35} color={Colors.PRIMARY} />
            </View>

            <Text style={{
                fontSize: 24,
                fontFamily: 'outfit-bold',
                textAlign: 'center',
                color: Colors.BLACK
            }}>No trips planned yet</Text>

            <Text style={{
                fontSize: 16,
                fontFamily: 'outfit',
                textAlign: 'center',
                color: Colors.GRAY,
                lineHeight: 24
            }}>Looks like its time to plan a new adventure! Get started here.</Text>

            <TouchableOpacity onPress={() => router.push('/create-trip/search-place')}
                style={{
                    paddingVertical: 15,
                    paddingHorizontal: 30,
                    backgroundColor: Colors.PRIMARY,
                    borderRadius: 50,
                    alignItems: 'center',
                    marginTop: 10,
                    shadowColor: Colors.PRIMARY,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5
                }}>
                <Text style={{
                    color: Colors.WHITE,
                    fontFamily: 'outfit-medium',
                    fontSize: 18
                }}>Start a new trip</Text>
            </TouchableOpacity>
        </View>
    )
}