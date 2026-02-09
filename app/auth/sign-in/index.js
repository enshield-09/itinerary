import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRouter } from 'expo-router';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { auth } from '../../../configs/FirebaseConfig';
import Colors from '../../../constants/Colors';

export default function SignIn() {
  const navigation = useNavigation();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    try {
      navigation.setOptions({
        headerShown: false
      });
    } catch (e) {
      // ignore if not supported
    }
  }, [navigation]);

  const onSignIn = () => {
    if (!email && !password) {
      ToastAndroid.show("Please enter Email & Password", ToastAndroid.LONG);
      return;
    }

    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(user);
        setLoading(false);
        router.replace('/mytrip');
      })
      .catch((error) => {
        setLoading(false);
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorMessage, errorCode);
        if (errorCode == 'auth/invalid-credential') {
          ToastAndroid.show("Invalid credentials", ToastAndroid.LONG);
        } else {
          ToastAndroid.show(errorMessage || 'Sign in failed', ToastAndroid.LONG);
        }
      });
  };

  const onResetPassword = () => {
    if (!email) {
      ToastAndroid.show("Please enter your Email first", ToastAndroid.LONG);
      return;
    }

    setLoading(true);
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setLoading(false);
        ToastAndroid.show("Password reset email sent!", ToastAndroid.LONG);
        Alert.alert("Success", "Check your email for instructions to reset your password.");
      })
      .catch((error) => {
        setLoading(false);
        const errorMessage = error.message;
        ToastAndroid.show(errorMessage || 'Failed to send reset email', ToastAndroid.LONG);
      });
  };

  return (
    <ImageBackground
      source={require('./../../../assets/images/signin.jpg')}
      style={styles.bg}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <Ionicons name="arrow-back-circle-sharp" size={36} color={Colors.WHITE} />
            </TouchableOpacity>

            <Text style={styles.title}>Lets Sign You In</Text>
            <Text style={styles.subtitle}>Welcome Back</Text>

            <View style={styles.form}>
              {/* Email */}
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                onChangeText={(value) => setEmail(value)}
                placeholder="Enter Email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
              />

              {/* Password */}
              <Text style={[styles.label, { marginTop: 18 }]}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  secureTextEntry={!showPassword}
                  onChangeText={(value) => setPassword(value)}
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  placeholder="Enter password"
                  placeholderTextColor="#888"
                  value={password}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}
                >
                  <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                onPress={onResetPassword}
                style={{ alignSelf: 'flex-end', marginTop: 10, padding: 5 }}
              >
                <Text style={{ fontFamily: 'outfit', color: Colors.PRIMARY, fontSize: 14 }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Sign in button */}
              <TouchableOpacity
                onPress={onSignIn}
                style={[styles.button, loading ? styles.buttonDisabled : null]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.WHITE} />
                ) : (
                  <Text style={styles.buttonText}>Sign in</Text>
                )}
              </TouchableOpacity>

              {/* Create account button */}
              <TouchableOpacity
                onPress={() => router.replace('auth/sign-up')}
                style={styles.outlineButton}
              >
                <Text style={styles.outlineText}>Create Account</Text>
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
    backgroundColor: 'rgba(6,12,34,0.45)'
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
  title: {
    fontFamily: 'outfit-bold',
    fontSize: 40,
    marginTop: 20,
    color: Colors.WHITE,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6
  },
  subtitle: {
    fontFamily: 'outfit',
    fontSize: 24,
    marginTop: 5,
    color: Colors.WHITE,
    opacity: 0.9
  },
  form: {
    marginTop: 40,
    backgroundColor: 'rgba(255,255,255,0.96)',
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
    color: '#333',
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
    backgroundColor: '#fff',
    color: '#111'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingRight: 10
  },
  eyeIcon: {
    paddingVertical: 10,
    paddingHorizontal: 6
  },
  button: {
    marginTop: 40,
    padding: 18,
    borderRadius: 12,
    backgroundColor: Colors.PRIMARY || '#0B66FF',
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
    color: '#666',
    fontFamily: 'outfit-medium',
    fontSize: 16
  }
});
