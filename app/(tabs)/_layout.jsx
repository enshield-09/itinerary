import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown:false
    }}>
        <Tabs.Screen name="mytrip" 
          options={{
            tabBarLabel:'My Trip',
            tabBarIcon:({color})=><Ionicons name="location-sharp" size={24} color="black" />
          }}
        />
        <Tabs.Screen name="discover"
          options={{
            tabBarLabel:'Discover',
            tabBarIcon:({color})=><Ionicons name="globe-outline" size={24} color="black" />
          }}
       />
        <Tabs.Screen name="profile" 
          options={{
            tabBarLabel:'Profile',
            tabBarIcon:({color})=><Ionicons name="person-circle-outline" size={24} color="black" />
          }}
        />
    </Tabs>
  )
}