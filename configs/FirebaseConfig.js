// configs/FirebaseConfig.js

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// your configuration
const firebaseConfig = {
    apiKey: "AIzaSyCyvb2nEpjU9S4Iyuaz3-hvvDSYoWYeVds",
    authDomain: "itinerary-app-274ba.firebaseapp.com",
    projectId: "itinerary-app-274ba",
    storageBucket: "itinerary-app-274ba.firebasestorage.app",
    messagingSenderId: "994657811114",
    appId: "1:994657811114:web:ca08f8a26dc0e4c296eed3",
    measurementId: "G-PML4YDB0VH"
};

const app = initializeApp(firebaseConfig);

// Use getAuth for web, initializeAuth with persistence for native
let auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
}

export { auth };

// You can export `app` too if needed
export { app };

export const db = getFirestore(app);