import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore
import { auth, db } from '../../../configs/FirebaseConfig'; // Import db
import Colors from './../../../constants/Colors';
import { useTheme } from '../../../context/ThemeContext';

export default function SignUp() {
  const navigation = useNavigation();
  const router = useRouter();
  const { colors, theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    try {
      navigation.setOptions({
        headerShown: false
      });
    } catch (e) { }
  }, [navigation]);

  const showToast = (msg) => {
    ToastAndroid.show(msg, ToastAndroid.LONG);
  };

  const onCreateAccount = () => {
    if (!fullName?.trim()) {
      showToast('Please enter your full name');
      return;
    }
    if (!email?.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    createUserWithEmailAndPassword(auth, email.trim(), password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        console.log('Signup success', user);

        // Save user to Firestore
        try {
          await setDoc(doc(db, "Users", user.uid), {
            uid: user.uid,
            fullName: fullName,
            email: email,
            createdAt: new Date()
          });
        } catch (e) {
          console.error("Error saving user to DB:", e);
          // Continue anyway as auth succeeded
        }

        setLoading(false);
        router.replace('/mytrip');
      })
      .catch((error) => {
        setLoading(false);
        showToast(error.message || 'Signup failed');
      });
  };

  return (
    <ImageBackground
      source={require('./../../../assets/images/signup.jpg')}
      style={styles.bg}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
              <Ionicons name="arrow-back-circle-sharp" size={40} color={Colors.WHITE} />
            </TouchableOpacity>

            <Text style={styles.heading}>Create New Account</Text>

            <View style={[styles.form, { backgroundColor: theme === 'dark' ? 'rgba(30,30,30,0.96)' : 'rgba(255,255,255,0.95)' }]}>
              {/* Full Name */}
              <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholder="Enter full name"
                placeholderTextColor={colors.icon}
                value={fullName}
                onChangeText={(v) => setFullName(v)}
              />

              {/* Email */}
              <Text style={[styles.label, { marginTop: 18, color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholder="Enter email"
                placeholderTextColor={colors.icon}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(v) => setEmail(v)}
              />

              {/* Password */}
              <Text style={[styles.label, { marginTop: 18, color: colors.text }]}>Password</Text>

              {/* 👇 Password Field with Eye Icon */}
              <View style={[styles.passwordContainer, {
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                borderColor: colors.border
              }]}>
                <TextInput
                  secureTextEntry={!showPassword}
                  style={[styles.input, {
                    flex: 1,
                    borderWidth: 0,
                    backgroundColor: 'transparent',
                    color: colors.text
                  }]}
                  placeholder="Enter password"
                  placeholderTextColor={colors.icon}
                  value={password}
                  onChangeText={(v) => setPassword(v)}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={24}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              </View>

              {/* Create Account */}
              <TouchableOpacity
                onPress={onCreateAccount}
                style={[styles.button, loading ? styles.buttonDisabled : null, { backgroundColor: Colors.PRIMARY }]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.WHITE} />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* Sign In Link */}
              <TouchableOpacity
                onPress={() => router.replace('auth/sign-in')}
                style={styles.outlineButton}
              >
                <Text style={[styles.outlineText, { color: colors.text }]}>Already have an account? Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  bgImage: {
    width: '100%',
    opacity: 0.75
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 12, 34, 0.45)'
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40
  },
  back: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)'
  },
  heading: {
    fontFamily: 'outfit-bold',
    fontSize: 40,
    color: Colors.WHITE,
    marginTop: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6
  },
  form: {
    marginTop: 40,
    // backgroundColor: 'rgba(255,255,255,0.95)', // Moved
    borderRadius: 18,
    padding: 30,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6
  },
  label: {
    fontFamily: 'outfit-medium',
    // color: '#333', // Moved
    fontSize: 18,
    marginBottom: 8
  },
  input: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 12,
    fontFamily: 'outfit',
    fontSize: 16,
    // backgroundColor: '#fff', // Moved
    // color: '#111' // Moved
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 12,
    // backgroundColor: '#fff', // Moved
    paddingRight: 10
  },
  eyeIcon: {
    paddingVertical: 10,
    paddingHorizontal: 6
  },

  button: {
    marginTop: 30,
    padding: 18,
    borderRadius: 12,
    // backgroundColor: Colors.PRIMARY || '#0B66FF',
    alignItems: 'center',
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: Colors.WHITE,
    fontFamily: 'outfit-bold',
    fontSize: 20
  },
  outlineButton: {
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  outlineText: {
    // color: '#666', // Moved
    fontFamily: 'outfit-medium',
    fontSize: 16
  }
});
