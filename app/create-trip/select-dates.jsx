import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useContext, useEffect, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { DatePickerModal } from 'react-native-paper-dates';
import { Colors } from './../../constants/theme';
import { CreateTripContext } from './../../context/CreateTripContext';
import { useTheme } from '../../context/ThemeContext';

export default function SelectDates() {
  const navigation = useNavigation();
  const router = useRouter();
  const { tripData, setTripData } = useContext(CreateTripContext);
  const { colors, theme } = useTheme();

  const [open, setOpen] = useState(false);
  const [range, setRange] = useState({ startDate: undefined, endDate: undefined });

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: ''
    });
  }, [navigation]);

  const onConfirm = useCallback(({ startDate, endDate }) => {
    setOpen(false);
    setRange({ startDate, endDate });
    console.log('Selected range:', startDate, endDate);
  }, []);

  const onDismiss = useCallback(() => {
    setOpen(false);
  }, []);

  const saveTripData = async (start, end, days) => {
    setTripData(prev => {
      const newData = {
        ...prev,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalNoOfDays: days
      };

      // Save to local storage asynchronously
      AsyncStorage.setItem('tripData', JSON.stringify(newData))
        .then(() => console.log('Saved tripData:', newData))
        .catch(e => console.log('Error saving tripData', e));

      return newData;
    });
  };

  const onContinue = () => {
    if (!range.startDate || !range.endDate) {
      alert('Please select both start and end dates.');
      return;
    }
    const diffTime = Math.abs(range.endDate.getTime() - range.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
    saveTripData(range.startDate, range.endDate, diffDays);

    router.push('/create-trip/select-budget');
  };

  const today = new Date();

  return (
    <ImageBackground
      source={require('./../../assets/images/select-dates.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={[styles.container, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)' }]}>
        <View>
          <Text style={[styles.headerText, { color: colors.text }]}>Travel Dates</Text>

          <TouchableOpacity
            onPress={() => setOpen(true)}
            style={[styles.selectButton, {
              marginTop: 60,
              backgroundColor: colors.card,
              borderColor: colors.border
            }]}
          >
            <Text style={[styles.selectButtonText, { color: colors.text }]}>
              {range.startDate && range.endDate
                ? `From ${range.startDate.toLocaleDateString()} to ${range.endDate.toLocaleDateString()}`
                : 'Select Travel Dates'}
            </Text>
          </TouchableOpacity>
        </View>

        <DatePickerModal
          locale="en"
          mode="range"
          visible={open}
          onDismiss={onDismiss}
          startDate={range.startDate}
          endDate={range.endDate}
          onConfirm={onConfirm}
          validRange={{ startDate: today }}
        />

        <TouchableOpacity
          onPress={onContinue}
          style={[styles.continueButton, { backgroundColor: Colors.PRIMARY }]}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 70,
    paddingBottom: 30,
    // backgroundColor: 'rgba(255,255,255,0.85)', // Moved to style prop
    justifyContent: 'space-between'
  },
  headerText: {
    fontFamily: 'outfit-bold',
    fontSize: 35,
    marginTop: 20,
    // color: Colors.BLACK // Moved
  },
  selectButton: {
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    // borderColor: '#ddd', // Moved
    // backgroundColor: Colors.WHITE, // Moved
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  selectButtonText: {
    fontSize: 18,
    // color: Colors.BLACK, // Moved
    fontFamily: 'outfit-medium'
  },
  continueButton: {
    paddingVertical: 18,
    // backgroundColor: Colors.BLACK, // Moved
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  continueButtonText: {
    color: Colors.WHITE,
    fontFamily: 'outfit-bold',
    fontSize: 20
  }
});
