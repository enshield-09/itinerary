import { Redirect, useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import 'react-native-get-random-values';
import Login from './../components/Login';
import { auth } from './../configs/FirebaseConfig';
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import Colors from "../constants/Colors";

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth as any, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Login user={user} />
    </View>
  );
}
