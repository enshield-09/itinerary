import { Stack } from "expo-router";
import { useState } from "react";
import { CreateTripContext } from '../context/CreateTripContext';
import { useFonts } from 'expo-font';
import { Outfit_400Regular, Outfit_500Medium, Outfit_700Bold } from '@expo-google-fonts/outfit';

export default function RootLayout() {

  const [fontsLoaded] = useFonts({
    'outfit': Outfit_400Regular,
    'outfit-medium': Outfit_500Medium,
    'outfit-bold': Outfit_700Bold,
  });

  const [tripData, setTripData] = useState([]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <CreateTripContext.Provider value={{ tripData, setTripData }}>
      <Stack screenOptions={{
        headerShown: false
      }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </CreateTripContext.Provider>
  );

}
