import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

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

export default function EditTripItemModal({ visible, onClose, onSave, initialData, type }) {
    const [formData, setFormData] = useState({});
    const ref = useRef();

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            // Pre-fill autocomplete if available
            setTimeout(() => {
                ref.current?.setAddressText(initialData.name || '');
            }, 100);
        } else {
            // Default empty state for new items
            if (type === 'hotel') {
                setFormData({ name: '', address: '', price: '', rating: '', description: '' });
            } else {
                setFormData({ name: '', time: '', ticket_price: '', description: '' });
            }
            setTimeout(() => {
                ref.current?.setAddressText('');
            }, 100);
        }
    }, [initialData, visible, type]);

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

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
                            <Text style={styles.title}>{initialData ? 'Edit' : 'Add'} {type === 'hotel' ? 'Hotel' : 'Activity'}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={Colors.BLACK} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ zIndex: 10 }}>
                            <Text style={styles.label}>Name</Text>

                            {GooglePlacesAutocomplete ? (
                                <View style={{ height: 50, zIndex: 10, marginBottom: 15 }}>
                                    <GooglePlacesAutocomplete
                                        ref={ref}
                                        placeholder='Search Place...'
                                        fetchDetails={true}
                                        onPress={(data, details = null) => {
                                            // Handle Selection
                                            const name = data.description || details?.name;
                                            const address = details?.formatted_address || data.description; // Prefer formatted
                                            const location = details?.geometry?.location;
                                            const photoRef = details?.photos?.[0]?.photo_reference;
                                            const rating = details?.rating ? details.rating.toString() : ''; // Get Rating

                                            let imageUrl = null;

                                            // Construct Image URL immediately if available
                                            if (photoRef) {
                                                imageUrl = `https://places.googleapis.com/v1/${photoRef}/media?maxHeightPx=800&maxWidthPx=800&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`;
                                            }

                                            setFormData(prev => ({
                                                ...prev,
                                                name: name,
                                                address: address, // For hotels/places, this is useful
                                                description: prev.description || address, // Auto-fill desc if empty
                                                coordinates: location, // {lat, lng}
                                                image_url: imageUrl,
                                                rating: rating // Auto-fill rating
                                            }));
                                        }}
                                        query={{
                                            key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
                                            language: 'en',
                                        }}
                                        styles={{
                                            textInputContainer: styles.autocompleteContainer,
                                            textInput: styles.input,
                                            listView: { backgroundColor: 'white', marginTop: 5 } // Flow Layout
                                        }}
                                        textInputProps={{
                                            onChangeText: (text) => handleChange('name', text),
                                            placeholderTextColor: '#999'
                                        }}
                                        enablePoweredByContainer={false}
                                        predefinedPlaces={[]}
                                    />
                                </View>
                            ) : (
                                <TextInput
                                    style={[styles.input, { marginBottom: 15 }]}
                                    value={formData.name}
                                    onChangeText={(t) => handleChange('name', t)}
                                    placeholder="e.g. Grand Hotel or Eiffel Tower"
                                />
                            )}
                        </View>

                        <ScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <Text style={styles.label}>Description/Address</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.description || formData.address} // Handle both fields
                                onChangeText={(t) => {
                                    handleChange('description', t);
                                    if (type === 'hotel') handleChange('address', t); // Sync for hotel
                                }}
                                placeholder="Details about the place..."
                                multiline={true}
                                numberOfLines={3}
                            />

                            <View style={styles.row}>
                                <View style={styles.col}>
                                    <Text style={styles.label}>{type === 'hotel' ? 'Price/Night' : 'Ticket Price'}</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.price || formData.ticket_price || formData.price_per_night} // Handle variations
                                        onChangeText={(t) => {
                                            if (type === 'hotel') {
                                                handleChange('price', t);
                                                handleChange('price_per_night', t);
                                            } else {
                                                handleChange('ticket_price', t);
                                            }
                                        }}
                                        placeholder="$100"
                                    />
                                </View>
                                <View style={styles.col}>
                                    <Text style={styles.label}>{type === 'hotel' ? 'Rating' : 'Time'}</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.rating || formData.time}
                                        onChangeText={(t) => handleChange(type === 'hotel' ? 'rating' : 'time', t)}
                                        placeholder={type === 'hotel' ? "4.5" : "10:00 AM"}
                                    />
                                </View>
                            </View>

                            <View style={{ height: 100 }} />
                        </ScrollView>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Changes</Text>
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
        justifyContent: 'center', // Centered for better form UX
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
        marginBottom: 5,
        marginTop: 10,
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
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15
    },
    col: {
        flex: 1
    },
    saveButton: {
        backgroundColor: Colors.PRIMARY,
        padding: 16,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 20
    },
    saveButtonText: {
        fontFamily: 'outfit-bold',
        fontSize: 16,
        color: Colors.WHITE
    }
});
