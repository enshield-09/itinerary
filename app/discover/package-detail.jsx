import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { TripPackages } from '../../constants/Options';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext } from 'react';
import { CreateTripContext } from '../../context/CreateTripContext';

const { width } = Dimensions.get('window');

import { useTheme } from '../../context/ThemeContext';

export default function PackageDetail() {
    const { packageId } = useLocalSearchParams();
    const router = useRouter();
    const { setTripData } = useContext(CreateTripContext);
    const { colors } = useTheme();

    const pkg = TripPackages.find(p => p.id.toString() === packageId);

    if (!pkg) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Package not found</Text>
            </View>
        );
    }

    const handleBookNow = () => {
        // Navigate to generation with pre-filled data
        setTripData(pkg.tripData);
        router.push('/create-trip/generate-trip');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={pkg.image}
                        style={styles.image}
                        contentFit="cover"
                        transition={500}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.imageOverlay}
                    />
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={styles.title}>{pkg.name}</Text>
                        <Text style={styles.duration}>{pkg.duration} • {pkg.price}</Text>
                    </View>
                </View>

                <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
                    {/* Overview */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
                    <Text style={[styles.description, { color: colors.text }]}>{pkg.desc}</Text>

                    <View style={styles.tagsContainer}>
                        {pkg.tags.map((tag, index) => (
                            <View key={index} style={[styles.tag, { backgroundColor: colors.card }]}>
                                <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Package Details */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>What's Included</Text>

                    <View style={styles.detailRow}>
                        <View style={[styles.detailIcon, { backgroundColor: colors.card }]}>
                            <Ionicons name="location" size={24} color={Colors.PRIMARY} />
                        </View>
                        <View>
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>Destination</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{pkg.tripData.locationInfo.name}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={[styles.detailIcon, { backgroundColor: colors.card }]}>
                            <Ionicons name="people" size={24} color={Colors.PRIMARY} />
                        </View>
                        <View>
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>Travelers</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{pkg.tripData.traveler.title}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={[styles.detailIcon, { backgroundColor: colors.card }]}>
                            <Ionicons name="wallet" size={24} color={Colors.PRIMARY} />
                        </View>
                        <View>
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>Budget Range</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{pkg.tripData.budget.title}</Text>
                        </View>
                    </View>

                    {/* Itinerary Preview Mockup (Static for package feel) */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Itinerary Highlights</Text>
                    <View style={[styles.itineraryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.dayRow}>
                            <View style={styles.dayBadge}><Text style={styles.dayText}>Day 1</Text></View>
                            <Text style={[styles.dayDesc, { color: colors.text }]}>Arrival & City Exploration</Text>
                        </View>
                        <View style={styles.connector} />
                        <View style={styles.dayRow}>
                            <View style={styles.dayBadge}><Text style={styles.dayText}>Day 2</Text></View>
                            <Text style={[styles.dayDesc, { color: colors.text }]}>Guided Tours & Local Cuisine</Text>
                        </View>
                        <View style={styles.connector} />
                        <View style={styles.dayRow}>
                            <View style={styles.dayBadge}><Text style={styles.dayText}>Day {parseInt(pkg.duration)}</Text></View>
                            <Text style={[styles.dayDesc, { color: colors.text }]}>Leisure & Departure</Text>
                        </View>
                    </View>

                </View>
            </ScrollView>

            {/* Bottom Booking Bar */}
            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <View>
                    <Text style={[styles.footerPriceLabel, { color: colors.icon }]}>Total Price</Text>
                    <Text style={[styles.footerPrice, { color: colors.text }]}>
                        {pkg.price === 'Cheap' ? '$800 - $1200' :
                            pkg.price === 'Moderate' ? '$1500 - $2500' :
                                '$3500+'}
                    </Text>
                </View>
                <TouchableOpacity style={[styles.bookButton, { backgroundColor: Colors.PRIMARY }]} onPress={handleBookNow}>
                    <Text style={[styles.bookButtonText, { color: '#fff' }]}>Book This Trip</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE,
    },
    imageContainer: {
        height: 350,
        width: '100%',
        position: 'relative',
    },
    image: {
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
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    title: {
        fontSize: 32,
        fontFamily: 'outfit-bold',
        color: 'white',
        marginBottom: 5,
    },
    duration: {
        fontSize: 16,
        fontFamily: 'outfit-medium',
        color: '#e0e0e0',
    },
    contentContainer: {
        padding: 25,
        marginTop: -30,
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        minHeight: 500,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'outfit-bold',
        marginTop: 20,
        marginBottom: 15,
        color: Colors.BLACK,
    },
    description: {
        fontSize: 16,
        fontFamily: 'outfit',
        color: Colors.GRAY,
        lineHeight: 24,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 15,
    },
    tag: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tagText: {
        color: Colors.GRAY,
        fontFamily: 'outfit',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 15,
    },
    detailIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f9ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        color: Colors.GRAY,
        fontFamily: 'outfit',
    },
    detailValue: {
        fontSize: 18,
        fontFamily: 'outfit-medium',
        color: Colors.BLACK,
    },
    itineraryCard: {
        backgroundColor: '#fafafa',
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    dayBadge: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    dayText: {
        color: 'white',
        fontFamily: 'outfit-bold',
        fontSize: 12,
    },
    dayDesc: {
        fontFamily: 'outfit-medium',
        fontSize: 16,
        color: Colors.BLACK,
    },
    connector: {
        height: 20,
        width: 2,
        backgroundColor: '#ddd',
        marginLeft: 28, // Align with badge center approx
        marginVertical: 5
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        paddingBottom: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        elevation: 10,
    },
    footerPriceLabel: {
        fontSize: 12,
        color: Colors.GRAY,
        fontFamily: 'outfit',
    },
    footerPrice: {
        fontSize: 24,
        color: Colors.BLACK,
        fontFamily: 'outfit-bold',
    },
    bookButton: {
        backgroundColor: Colors.BLACK,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 30,
    },
    bookButtonText: {
        color: 'white',
        fontFamily: 'outfit-medium',
        fontSize: 16,
    }
});
