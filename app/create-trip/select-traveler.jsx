import { Link, useNavigation, router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useContext, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OptionCard from '../../components/CreateTrip/OptionCard';
import { CreateTripContext } from '../../context/CreateTripContext';
import { SelectTravelerList } from './../../constants/Options';
import { Colors } from './../../constants/theme';

const { width, height } = Dimensions.get('window');

export default function SelectTraveler() {

  const navigation = useNavigation();
  const [selectedTraveler, setSelectedTraveler] = useState();
  const { tripData, setTripData } = useContext(CreateTripContext);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: ''
    })
  }, [])

  const onContinue = () => {
    if (!selectedTraveler) {
      // You might want to add an Alert here/toast
      return;
    }
    setTripData(prev => ({
      ...prev,
      traveler: selectedTraveler
    }));
    router.push('/create-trip/select-dates');
  };

  const backgrounds = [
    require('../../assets/images/traveler1.jpg'),
    require('../../assets/images/traveler2.jpg'),
    require('../../assets/images/traveler3.jpg'),
    require('../../assets/images/traveler4.jpg'),
  ];

  const [bgIndex, setBgIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  /* Animation Logic */
  const isFocused = useIsFocused();

  useEffect(() => {
    let interval;
    if (isFocused) {
      interval = setInterval(() => {
        Animated.timing(fade, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }).start(() => {
          setBgIndex(prev => (prev + 1) % backgrounds.length);
          Animated.timing(fade, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }).start();
        });
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [fade, isFocused]);

  return (
    <View style={{ flex: 1 }}>
      {/* Background image with fade */}
      <Animated.View style={[styles.bgWrapper, { opacity: fade }]}>
        <ImageBackground
          source={backgrounds[bgIndex]}
          style={styles.bg}
          imageStyle={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
      </Animated.View>

      {/* Foreground content */}
      <View style={styles.container}>
        <Text style={styles.title}>Who is Traveling..?</Text>

        <View style={styles.subHeaderWrap}>
          <Text style={styles.subHeader}>Choose your traveles</Text>
        </View>

        <FlatList
          data={SelectTravelerList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.flatContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedTraveler(item)}
              style={styles.optionTouchable}>
              <OptionCard option={item} selectedOption={selectedTraveler} />
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={onContinue}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1
  },
  bg: {
    width: '100%',
    height: '100%'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 18, 44, 0.36)'
  },
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 75,
    backgroundColor: 'transparent',
    minHeight: height
  },
  title: {
    fontSize: 35,
    fontFamily: 'outfit-bold',
    marginTop: 25,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10
  },
  subHeaderWrap: {
    marginTop: 10
  },
  subHeader: {
    fontFamily: 'outfit-medium',
    fontSize: 20,
    color: '#e8eef9',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5
  },

  /* FlatList content: distribute items evenly vertically */
  flatContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 15
  },
  optionTouchable: {
    // no marginVertical so spacing is handled by list distribution
  },

  continueBtn: {
    padding: 18,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 50,
    marginTop: 20,
    alignSelf: 'stretch',
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  continueText: {
    textAlign: 'center',
    color: Colors.WHITE,
    fontFamily: 'outfit-bold',
    fontSize: 20
  }
});
