import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { SelectBudgetOptions, SelectTravelerList } from '../../constants/Options';

// Conditionally import GooglePlacesAutocomplete
let GooglePlacesAutocomplete = null;
if (Platform.OS !== 'web') {
    try {
        const module = require('react-native-google-places-autocomplete');
        GooglePlacesAutocomplete = module.GooglePlacesAutocomplete;
    } catch (e) {
        console.warn('GooglePlacesAutocomplete not available:', e);
    }
}

export default function EditTripSettingsModal({ visible, onClose, onSave, tripData }) {
    const [destination, setDestination] = useState('');
    const [duration, setDuration] = useState('');
    const [budget, setBudget] = useState('');
    const [travelerType, setTravelerType] = useState('');
    const [customAttractions, setCustomAttractions] = useState([]);

    useEffect(() => {
        if (tripData && visible) {
            // Parse tripData (it's stored as JSON string in Firestore)
            const parsed = typeof tripData === 'string' ? JSON.parse(tripData) : tripData;
            setDestination(parsed?.locationInfo?.name || '');
            setDuration(String(parsed?.totalNoOfDays || ''));
            setBudget(parsed?.budget?.title || '');
            setTravelerType(parsed?.traveler?.title || '');
            setCustomAttractions(parsed?.customAttractions || []);
        }
    }, [tripData, visible]);

    const handleSave = () => {
        // Find full objects from options
        const budgetObj = SelectBudgetOptions.find(b => b.title === budget) || { title: budget };
        const travelerObj = SelectTravelerList.find(t => t.title === travelerType) || { title: travelerType };

        onSave({
            locationInfo: { name: destination },
            totalNoOfDays: parseInt(duration) || 3,
            budget: budgetObj,
            traveler: travelerObj,
            customAttractions: customAttractions
        });
        onClose();
    };

    const addAttraction = (name) => {
        if (name && !customAttractions.includes(name)) {
            setCustomAttractions([...customAttractions, name]);
        }
    };

    const removeAttraction = (name) => {
        setCustomAttractions(customAttractions.filter(item => item !== name));
    };

    const budgetOptions = ['Cheap', 'Moderate', 'Luxury'];
    const travelerOptions = ['Just Me', 'Couple', 'Family', 'Friends'];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    <View style={styles.card}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Edit Trip Settings</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={Colors.BLACK} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ zIndex: 20 }}>
                            <Text style={styles.label}>Destination</Text>
                            {GooglePlacesAutocomplete ? (
                                <View style={{ height: 50, zIndex: 20, marginBottom: 15 }}>
                                    <GooglePlacesAutocomplete
                                        placeholder='Search Destination'
                                        fetchDetails={true}
                                        onPress={(data, details = null) => {
                                            setDestination(data.description);
                                        }}
                                        query={{
                                            key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
                                            language: 'en',
                                        }}
                                        styles={{
                                            textInputContainer: styles.autocompleteContainer,
                                            textInput: styles.input,
                                            listView: { backgroundColor: 'white', zIndex: 2000, position: 'absolute', top: 50, left: 0, right: 0, elevation: 5 }
                                        }}
                                        textInputProps={{
                                            value: destination,
                                            onChangeText: setDestination,
                                            placeholderTextColor: '#999'
                                        }}
                                        enablePoweredByContainer={false}
                                        predefinedPlaces={[]}
                                    />
                                </View>
                            ) : (
                                <TextInput
                                    style={[styles.input, { marginBottom: 15 }]}
                                    value={destination}
                                    onChangeText={setDestination}
                                    placeholder="e.g. Paris, France"
                                />
                            )}
                        </View>

                        <View style={{ zIndex: 10 }}>
                            <Text style={styles.label}>Add Must-Visit Places/Events</Text>
                            {GooglePlacesAutocomplete ? (
                                <View style={{ height: 50, zIndex: 10, marginBottom: 5 }}>
                                    <GooglePlacesAutocomplete
                                        placeholder='Search Attractions...'
                                        fetchDetails={true}
                                        onPress={(data, details = null) => {
                                            addAttraction(data.description);
                                        }}
                                        query={{
                                            key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
                                            language: 'en',
                                        }}
                                        styles={{
                                            textInputContainer: styles.autocompleteContainer,
                                            textInput: styles.input,
                                            listView: { backgroundColor: 'white', zIndex: 1000, position: 'absolute', top: 50, left: 0, right: 0, elevation: 5 }
                                        }}
                                        textInputProps={{
                                            placeholderTextColor: '#999',
                                            returnKeyType: "search"
                                        }}
                                        enablePoweredByContainer={false}
                                        predefinedPlaces={[]}
                                    />
                                </View>
                            ) : null}
                        </View>

                        <ScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View style={styles.chipContainer}>
                                {customAttractions.map((attr, index) => (
                                    <View key={index} style={styles.chip}>
                                        <Text style={styles.chipText}>{attr}</Text>
                                        <TouchableOpacity onPress={() => removeAttraction(attr)}>
                                            <Ionicons name="close-circle" size={18} color={Colors.GRAY} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>


                            {/* Duration */}
                            <Text style={styles.label}>Duration (Days)</Text>
                            <TextInput
                                style={styles.input}
                                value={duration}
                                onChangeText={setDuration}
                                placeholder="5"
                                keyboardType="number-pad"
                            />

                            {/* Budget */}
                            <Text style={styles.label}>Budget</Text>
                            <View style={styles.optionRow}>
                                {budgetOptions.map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[
                                            styles.optionBtn,
                                            budget === opt && styles.optionBtnActive
                                        ]}
                                        onPress={() => setBudget(opt)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            budget === opt && styles.optionTextActive
                                        ]}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Traveler Type */}
                            <Text style={styles.label}>Traveler Type</Text>
                            <View style={styles.optionRow}>
                                {travelerOptions.map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[
                                            styles.optionBtn,
                                            travelerType === opt && styles.optionBtnActive
                                        ]}
                                        onPress={() => setTravelerType(opt)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            travelerType === opt && styles.optionTextActive
                                        ]}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{ height: 100 }} />
                        </ScrollView>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Settings</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', // Center it usually better for forms
        alignItems: 'center',
        padding: 20
    },
    container: {
        width: '100%',
        maxHeight: '90%'
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
        width: '100%',
        flexShrink: 1
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontFamily: 'outfit-bold',
        fontSize: 20,
    },
    form: {
        marginBottom: 10,
    },
    label: {
        fontFamily: 'outfit-medium',
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 10,
        padding: 12,
        fontFamily: 'outfit',
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        minHeight: 50
    },
    autocompleteContainer: {
        borderWidth: 0,
        padding: 0
    },
    optionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#f5f5f5',
    },
    optionBtnActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    optionText: {
        fontFamily: 'outfit-medium',
        fontSize: 14,
        color: Colors.GRAY,
    },
    optionTextActive: {
        color: Colors.WHITE,
    },
    saveButton: {
        backgroundColor: Colors.PRIMARY,
        padding: 16,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10
    },
    saveButtonText: {
        fontFamily: 'outfit-bold',
        fontSize: 16,
        color: Colors.WHITE
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10
    },
    chip: {
        backgroundColor: '#e6f2ff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    chipText: {
        fontFamily: 'outfit',
        color: Colors.PRIMARY,
        fontSize: 13,
        maxWidth: 200
    }
});
