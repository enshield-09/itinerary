import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

let MapView, Marker, Polyline, PROVIDER_GOOGLE, Callout;

if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
    Callout = Maps.Callout;
} else {
    // Dummy components for web/server to prevent crash
    const NullComp = () => null;
    MapView = () => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Maps are not available on Web</Text>
        </View>
    );
    Marker = NullComp;
    Polyline = NullComp;
    Callout = NullComp;
}

export default function TripMapView() {
    const { tripPlan } = useLocalSearchParams();
    const router = useRouter();
    const [parsedPlan, setParsedPlan] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [region, setRegion] = useState(null);
    const [showRoute, setShowRoute] = useState(true);
    const [selectedDay, setSelectedDay] = useState(null); // null = all days

    useEffect(() => {
        if (tripPlan) {
            try {
                const plan = JSON.parse(tripPlan);
                setParsedPlan(plan);
                extractMarkers(plan);
            } catch (e) {
                console.error("Failed to parse trip plan for map", e);
            }
        }
    }, [tripPlan]);

    const extractMarkers = (plan) => {
        const newMarkers = [];
        const routePoints = [];
        let markerOrder = 0;

        // Hotels (Blue) - Add first hotel as starting point
        plan?.hotels?.forEach((hotel, index) => {
            const coords = hotel.geo_coordinates || hotel.coordinates;
            if (coords) {
                const coordinate = {
                    latitude: parseFloat(coords.latitude || coords.lat),
                    longitude: parseFloat(coords.longitude || coords.lng),
                };
                newMarkers.push({
                    coordinate,
                    title: hotel.name,
                    description: "🏨 Hotel",
                    type: 'hotel',
                    color: Colors.PRIMARY,
                    order: -1, // Hotels always first
                    dayIndex: -1
                });
                // Add hotel as route start point
                if (index === 0) {
                    routePoints.push({ ...coordinate, order: 0 });
                }
            }
        });

        // Activities (grouped by day)
        plan?.daily_plan?.forEach((day, dayIndex) => {
            const activities = Array.isArray(day.activities) ? day.activities : [day];
            activities.forEach((act, actIndex) => {
                const coords = act.geo_coordinates || act.coordinates;
                if (coords) {
                    markerOrder++;
                    const coordinate = {
                        latitude: parseFloat(coords.latitude || coords.lat),
                        longitude: parseFloat(coords.longitude || coords.lng),
                    };
                    newMarkers.push({
                        coordinate,
                        title: act.name,
                        description: `📍 Day ${dayIndex + 1} • ${act.time || 'Anytime'}`,
                        type: 'activity',
                        color: getDayColor(dayIndex),
                        order: markerOrder,
                        dayIndex: dayIndex
                    });
                    routePoints.push({ ...coordinate, order: markerOrder, dayIndex });
                }
            });
        });

        // Sort route points by order
        routePoints.sort((a, b) => a.order - b.order);

        setMarkers(newMarkers);
        setRouteCoordinates(routePoints);

        // Calculate initial region
        if (newMarkers.length > 0) {
            const lats = newMarkers.map(m => m.coordinate.latitude);
            const lngs = newMarkers.map(m => m.coordinate.longitude);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);

            setRegion({
                latitude: (minLat + maxLat) / 2,
                longitude: (minLng + maxLng) / 2,
                latitudeDelta: (maxLat - minLat) * 1.5 + 0.05,
                longitudeDelta: (maxLng - minLng) * 1.5 + 0.05,
            });
        }
    };

    // Get different colors for different days
    const getDayColor = (dayIndex) => {
        const colors = ['#FF6347', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63'];
        return colors[dayIndex % colors.length];
    };

    // Filter markers by selected day
    const filteredMarkers = selectedDay !== null
        ? markers.filter(m => m.type === 'hotel' || m.dayIndex === selectedDay)
        : markers;

    // Filter route by selected day
    const filteredRoute = selectedDay !== null
        ? routeCoordinates.filter(r => r.order === 0 || r.dayIndex === selectedDay)
        : routeCoordinates;

    // Get unique days
    const uniqueDays = [...new Set(markers.filter(m => m.dayIndex >= 0).map(m => m.dayIndex))].sort();

    if (!parsedPlan || !region) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={{ marginTop: 10, fontFamily: 'outfit' }}>Loading Map...</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                region={region}
                showsUserLocation={true}
            >
                {/* Route Polyline */}
                {showRoute && filteredRoute.length > 1 && (
                    <Polyline
                        coordinates={filteredRoute}
                        strokeColor={selectedDay !== null ? getDayColor(selectedDay) : '#000'}
                        strokeWidth={3}
                        lineDashPattern={[5, 5]}
                    />
                )}

                {/* Markers with order numbers */}
                {filteredMarkers.map((marker, index) => (
                    <Marker
                        key={index}
                        coordinate={marker.coordinate}
                        title={marker.title}
                        description={marker.description}
                    >
                        <View style={[styles.markerContainer, { backgroundColor: marker.color }]}>
                            {marker.type === 'hotel' ? (
                                <Ionicons name="bed" size={16} color="white" />
                            ) : (
                                <Text style={styles.markerText}>{marker.order}</Text>
                            )}
                        </View>
                        <Callout>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>{marker.title}</Text>
                                <Text style={styles.calloutDesc}>{marker.description}</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            {/* Back Button */}
            <TouchableOpacity style={styles.backButtonOverlay} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            {/* Day Filter Pills */}
            <View style={styles.dayFilter}>
                <TouchableOpacity
                    style={[styles.dayPill, selectedDay === null && styles.dayPillActive]}
                    onPress={() => setSelectedDay(null)}
                >
                    <Text style={[styles.dayPillText, selectedDay === null && styles.dayPillTextActive]}>All</Text>
                </TouchableOpacity>
                {uniqueDays.map((day) => (
                    <TouchableOpacity
                        key={day}
                        style={[
                            styles.dayPill,
                            selectedDay === day && styles.dayPillActive,
                            { borderColor: getDayColor(day) }
                        ]}
                        onPress={() => setSelectedDay(day)}
                    >
                        <Text style={[
                            styles.dayPillText,
                            selectedDay === day && styles.dayPillTextActive
                        ]}>Day {day + 1}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Legend and Route Toggle */}
            <View style={styles.controlPanel}>
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: Colors.PRIMARY }]} />
                        <Text style={styles.legendText}>Hotel</Text>
                    </View>
                    {uniqueDays.slice(0, 3).map((day) => (
                        <View key={day} style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: getDayColor(day) }]} />
                            <Text style={styles.legendText}>Day {day + 1}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.routeToggle}>
                    <Text style={styles.toggleText}>Route</Text>
                    <Switch
                        value={showRoute}
                        onValueChange={setShowRoute}
                        trackColor={{ false: '#ccc', true: Colors.PRIMARY }}
                        thumbColor={showRoute ? '#fff' : '#f4f3f4'}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        marginTop: 20
    },
    backButtonOverlay: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    },
    markerContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5
    },
    markerText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12
    },
    callout: {
        padding: 10,
        minWidth: 150,
    },
    calloutTitle: {
        fontFamily: 'outfit-bold',
        fontSize: 14,
        marginBottom: 4
    },
    calloutDesc: {
        fontFamily: 'outfit',
        fontSize: 12,
        color: '#666'
    },
    dayFilter: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dayPill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: 'white',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 3
    },
    dayPillActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    dayPillText: {
        fontFamily: 'outfit-medium',
        fontSize: 12,
        color: '#666'
    },
    dayPillTextActive: {
        color: 'white'
    },
    controlPanel: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        flex: 1
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5
    },
    legendText: {
        fontFamily: 'outfit-medium',
        fontSize: 11
    },
    routeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    toggleText: {
        fontFamily: 'outfit-medium',
        fontSize: 12,
        color: '#666'
    }
});
