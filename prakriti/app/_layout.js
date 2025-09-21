import { Stack } from 'expo-router/stack';
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Font from 'expo-font';
import * as Nav from 'expo-navigation-bar';

export default function Layout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function setup() {
      if (Platform.OS === 'android') {
        try {
          await Nav.setBehaviorAsync('overlay-swipe');
        } catch (e) {
          console.warn('Navigation bar behavior not supported (edge-to-edge?):', e);
        }
        try {
          await Nav.setVisibilityAsync('hidden');
        } catch (e) {
          console.warn('Navigation bar visibility not supported:', e);
        }
      }

      try {
        await Font.loadAsync({
          'Modak-Regular': require('../assets/fonts/Modak/Modak-Regular.ttf'),
          'Ubuntu-Regular': require('../assets/fonts/Ubuntu/Ubuntu-Regular.ttf'),
          'Ubuntu-Bold': require('../assets/fonts/Ubuntu/Ubuntu-Bold.ttf'),
          'Ubuntu-Medium': require('../assets/fonts/Ubuntu/Ubuntu-Medium.ttf'),
          'Ubuntu-Light': require('../assets/fonts/Ubuntu/Ubuntu-Light.ttf'),
        });
        setFontsLoaded(true);
      } catch (e) {
        console.warn('Font loading failed:', e);
      }
    }

    setup();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
        </>
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
}