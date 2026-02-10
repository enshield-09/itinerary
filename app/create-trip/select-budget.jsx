import { useNavigation, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import OptionCard from '../../components/CreateTrip/OptionCard';
import Colors from '../../constants/Colors';
import { SelectBudgetOptions } from '../../constants/Options';
import { CreateTripContext } from '../../context/CreateTripContext';
import { useTheme } from '../../context/ThemeContext';

const { height } = Dimensions.get('window');

export default function SelectBudget() {
  const router = useRouter();
  const { tripData, setTripData } = useContext(CreateTripContext);
  const { colors, theme } = useTheme();
  const [selectedOption, setSelectedOption] = useState(null);

  const onContinue = () => {
    if (!selectedOption) {
      alert('Please select a budget option.');
      return;
    }
    setTripData(prev => ({
      ...prev,
      budget: selectedOption
    }));
    setTimeout(() => {
      router.push('/create-trip/select-attractions');
    }, 50);
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
    require('../../assets/images/budget.jpg'),
    require('../../assets/images/budget1.jpg'),
    require('../../assets/images/budget2.jpg'),
    require('../../assets/images/budget3.jpg'),
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
      {/* Background with fade animation */}
      <Animated.View style={[styles.bgWrapper, { opacity: fade }]}>
        <ImageBackground
          source={backgrounds[bgIndex]}
          style={styles.bg}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
      </Animated.View>

      {/* Foreground UI (unchanged logic) */}
      <View style={[styles.container, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)' }]}>
        <Text style={[styles.title, { color: colors.text }]}>Budget</Text>

        <View style={{ marginTop: 25, flex: 1 }}>
          <Text style={[styles.subtitle, { color: colors.icon }]}>Choose spending habits for your trip</Text>

          <FlatList
            data={SelectBudgetOptions}
            keyExtractor={item => item.id.toString()}
            extraData={selectedOption}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedOption(item)}
                style={{ marginVertical: 20, marginTop: 30 }}
              >
                <OptionCard option={item} selectedOption={selectedOption} />
              </TouchableOpacity>
            )}
          />
        </View>

        <TouchableOpacity
          onPress={onContinue}
          style={[styles.continueButton, { backgroundColor: Colors.PRIMARY }]}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: 'rgba(5, 10, 30, 0.35)'
  },
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 75,
    paddingBottom: 30,
    // backgroundColor: 'rgba(255,255,255,0.85)', // Moved
  },
  title: {
    fontSize: 35,
    fontFamily: 'outfit-bold',
    marginTop: 25,
    color: '#000'
  },
  subtitle: {
    fontFamily: 'outfit',
    fontSize: 20,
    color: Colors.GRAY
  },
  continueButton: {
    padding: 18,
    // backgroundColor: Colors.BLACK, // Moved
    borderRadius: 50,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: Colors.BLACK,
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
