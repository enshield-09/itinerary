import { useNavigation, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import OptionCard from '../../components/CreateTrip/OptionCard';
import Colors from '../../constants/Colors';
import { SelectAttractionOptions } from '../../constants/Options';
import { CreateTripContext } from '../../context/CreateTripContext';

const { height } = Dimensions.get('window');

export default function SelectAttractions() {
  const router = useRouter();
  const { tripData, setTripData } = useContext(CreateTripContext);

  const [selectedAttractions, setSelectedAttractions] = useState([]);

  const toggleAttraction = (item) => {
    setSelectedAttractions(prev => {
      if (prev.some(at => at.id === item.id)) {
        return prev.filter(at => at.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const onContinue = () => {
    if (selectedAttractions.length === 0) {
      alert('Please select at least one attraction.');
      return;
    }
    setTripData(prev => ({
      ...prev,
      selectedAttractions: selectedAttractions.map(at => at.title)
      //selectedAttractions: selectedAttractions
    }));
    router.push('/create-trip/review-trip');
  };

  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: ''
    });
  }, [navigation]);

  const backgrounds = [
    require('./../../assets/images/cultural.jpg'),
    require('./../../assets/images/sports.jpg'),
    require('./../../assets/images/music.jpg'),
    require('./../../assets/images/hiking.jpg'),
  ];

  const fade = useRef(new Animated.Value(1)).current;
  const [bgIndex, setBgIndex] = useState(0);

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
      {/* Animated background */}
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
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>What attracts you..?</Text>

        <View style={{ marginTop: 25 }}>
          <Text style={styles.subtitle}>Choose your attraction for trip</Text>

          {SelectAttractionOptions.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggleAttraction(item)}
              style={{ marginVertical: 10 }}
            >
              <OptionCard option={item} selectedOption={selectedAttractions} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={onContinue}
          style={styles.continueBtn}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
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
    backgroundColor: 'rgba(0,0,0,0.28)'
  },
  container: {
    padding: 25,
    paddingTop: 75,
    paddingBottom: 80,
    backgroundColor: 'transparent',
    minHeight: height
  },
  title: {
    fontSize: 35,
    fontFamily: 'outfit-bold',
    marginTop: 0,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10
  },
  subtitle: {
    fontFamily: 'outfit-medium',
    fontSize: 20,
    color: '#e8eef9',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5
  },
  continueBtn: {
    padding: 18,
    backgroundColor: Colors.BLACK,
    borderRadius: 50,
    marginTop: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  continueText: {
    color: Colors.WHITE,
    fontFamily: 'outfit-bold',
    fontSize: 20
  }
});
