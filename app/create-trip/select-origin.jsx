import { useNavigation, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useContext, useEffect, useState } from 'react';
import { Animated, Easing, ImageBackground, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CreateTripContext } from './../../context/CreateTripContext';
import { useTheme } from '../../context/ThemeContext';
import Colors from '../../constants/Colors';

// Conditionally import GooglePlacesAutocomplete only on native platforms
let GooglePlacesAutocomplete = null;
if (Platform.OS !== 'web') {
  try {
    const module = require('react-native-google-places-autocomplete');
    GooglePlacesAutocomplete = module.GooglePlacesAutocomplete;
  } catch (e) {
    console.warn('GooglePlacesAutocomplete not available:', e);
  }
}

export default function SelectOrigin() {
  const navigation = useNavigation();
  const router = useRouter();
  const { tripData, setTripData } = useContext(CreateTripContext);
  const { colors, theme } = useTheme();

  const bgImages = [
    require('./../../assets/images/tajmahal.jpg'),
    require('./../../assets/images/germany.jpg'),
    require('./../../assets/images/monaco.jpg'),
    require('./../../assets/images/australia.jpg'),
    require('./../../assets/images/switzerland.jpg'),
    require('./../../assets/images/paris.jpg'),
    require('./../../assets/images/newyork.jpg'),
    require('./../../assets/images/dubai.jpg'),
  ];

  const [bgIndex, setBgIndex] = useState(0);
  const fadeAnim = new Animated.Value(1);

  /* Animation Logic */
  const isFocused = useIsFocused();

  useEffect(() => {
    let interval;
    if (isFocused) {
      interval = setInterval(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true
        }).start(() => {
          setBgIndex((prev) => (prev + 1) % bgImages.length);

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true
          }).start();
        });
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [fadeAnim, isFocused]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: 'Where are you now?',
      headerTintColor: '#fff',
      fontSize: 40
    });
  }, [navigation]);

  const handleOriginSelect = (originData) => {
    setTripData(prev => ({
      ...prev,
      originLocation: originData
    }));
    setTimeout(() => {
      router.push('/create-trip/select-traveler');
    }, 50);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Background slideshow */}
      <Animated.View style={[styles.bgWrapper, { opacity: fadeAnim }]}>
        <ImageBackground
          source={bgImages[bgIndex]}
          style={styles.bg}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
      </Animated.View>

      {/* REAL SCREEN CONTENT */}
      <View style={styles.container}>
        <Text style={styles.title}>Where are you traveling from?</Text>
        <Text style={styles.subtitle}>Select your current location</Text>

        {Platform.OS === 'web' ? (
          <View>
            <TextInput
              style={[styles.webInput, {
                backgroundColor: theme === 'dark' ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
                color: colors.text
              }]}
              placeholder="Enter your current location (e.g., New York, USA)"
              placeholderTextColor={colors.icon}
              onChangeText={(text) => {
                if (text.length > 2) {
                  setTripData(prev => ({
                    ...prev,
                    originLocation: {
                      name: text,
                      coordinates: null,
                      photoRef: null,
                      url: null
                    }
                  }));
                }
              }}
              onSubmitEditing={(e) => {
                const locationName = e.nativeEvent.text;
                if (locationName) {
                  handleOriginSelect({
                    name: locationName,
                    coordinates: null,
                    photoRef: null,
                    url: null
                  });
                }
              }}
            />
            <TouchableOpacity
              style={[styles.webButton, { backgroundColor: Colors.PRIMARY }]}
              onPress={() => {
                const locationName = 'New York, USA'; // Default for demo
                handleOriginSelect({
                  name: locationName,
                  coordinates: null,
                  photoRef: null,
                  url: null
                });
              }}
            >
              <Text style={styles.webButtonText}>Continue with Demo Location</Text>
            </TouchableOpacity>
          </View>
        ) : GooglePlacesAutocomplete ? (
          <GooglePlacesAutocomplete
            placeholder="Search your current location"
            fetchDetails={true}
            predefinedPlaces={[]}
            predefinedPlacesAlwaysVisible={false}
            minLength={2}
            timeout={20000}
            keyboardShouldPersistTaps="handled"
            query={{
              key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
              language: 'en'
            }}
            onPress={(data, details = null) => {
              console.log('Selected origin:', data, details);
              handleOriginSelect({
                name: data.description,
                coordinates: details?.geometry.location,
                photoRef: details?.photos?.[0]?.photo_reference,
                url: details?.url
              });
            }}
            onFail={(error) => console.warn('Autocomplete error:', error)}
            onNotFound={() => console.log('No results found')}
            textInputProps={{
              onFocus: () => console.log('Input focused'),
              placeholderTextColor: colors.icon
            }}
            styles={{
              textInputContainer: {
                backgroundColor: theme === 'dark' ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.9)',
                borderRadius: 12,
                paddingHorizontal: 12,
                borderWidth: 0,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 5 },
                elevation: 5,
              },
              textInput: {
                height: 52,
                color: colors.text,
                fontSize: 18,
                fontWeight: '500',
                letterSpacing: 0.5
              },
              listView: {
                backgroundColor: colors.card,
                marginTop: 15,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border
              },
              description: {
                color: colors.text,
                fontWeight: '500'
              },
              poweredContainer: {
                display: 'none'
              }
            }}
          />
        ) : (
          <Text style={styles.errorText}>GooglePlacesAutocomplete not available</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bgWrapper: {
    ...StyleSheet.absoluteFillObject
  },
  bg: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 100
  },
  title: {
    fontSize: 28,
    fontFamily: 'outfit-bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'outfit-medium',
    color: '#e8eef9',
    marginBottom: 30,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  webInput: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 15,
    height: 55,
    color: '#111',
    fontSize: 18,
    fontFamily: 'outfit-medium',
    letterSpacing: 0.5,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  webButton: {
    marginTop: 20,
    backgroundColor: '#000',
    padding: 18,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  webButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'outfit-bold'
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'outfit'
  }
});

