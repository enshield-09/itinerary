import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

export default function Login({ user }) {
  const router = useRouter();

  // local images - ensure these exist in assets/images
  const images = useMemo(() => [
    require('./../assets/images/login1.jpg'),
    require('./../assets/images/login2.jpg'),
    require('./../assets/images/login3.jpg'),
    require('./../assets/images/login4.jpg'),
    require('./../assets/images/login5.jpg'),
  ], []);

  const [idx, setIdx] = useState(0);

  // animated values for subtle background zoom & cross-fade
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // gentle continuous zoom loop
    const zoomLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.03, duration: 4000, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.00, duration: 4000, useNativeDriver: true })
      ])
    );
    zoomLoop.start();

    // cross-fade interval
    const interval = setInterval(() => {
      // fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // switch image
        setIdx(prev => (prev + 1) % images.length);

        // reset fade to 0 and fade in
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => {
      clearInterval(interval);
      zoomLoop.stop();
    };
  }, [images.length, fadeAnim, scaleAnim]);

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
        <AnimatedImageBackground
          source={images[idx]}
          style={styles.bg}
          imageStyle={styles.imageStyle}
          resizeMode="cover"
        >
          {/* semi-transparent dark overlay for contrast */}
          <View style={styles.overlay} />

          <View style={styles.card}>
            <Text style={styles.title}>Itinerary AI</Text>

            <Text style={styles.subtitle}>
              Discover your next adventure effortlessly. Personalized itineraries at your fingertips.
            </Text>

            <TouchableOpacity
              style={styles.cta}
              onPress={() => {
                if (user) {
                  router.push('/mytrip');
                } else {
                  router.push('auth/sign-in');
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>
                {user ? 'Continue to App' : "Let's Get Started"}
              </Text>
            </TouchableOpacity>
          </View>
        </AnimatedImageBackground>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  bg: {
    width: '100%',           // explicit full width as requested
    height: '100%',
    justifyContent: 'flex-end',
  },
  imageStyle: {
    width: '100%',           // ensure source image uses full width
    opacity: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    paddingBottom: 45,
    minHeight: height * 0.40,
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  title: {
    fontFamily: 'outfit-bold',
    fontSize: 44,
    textAlign: 'center',
    color: '#000',
    marginTop: 20
  },
  subtitle: {
    fontFamily: 'outfit',
    fontSize: 17,
    textAlign: 'center',
    color: Colors.GRAY,
    marginTop: 20,
    lineHeight: 24,
    paddingHorizontal: 15,
  },
  cta: {
    marginTop: 40,
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    width: '100%'
  },
  ctaText: {
    color: Colors.WHITE,
    fontSize: 18,
    fontFamily: 'outfit-medium',
  },
});
