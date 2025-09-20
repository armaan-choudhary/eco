import { Stack } from 'expo-router/stack';
import { useState } from 'react';

export default function Layout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Mock login state

  return (
    <Stack>
      {!isLoggedIn ? (
        <Stack.Screen name="login" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }} // Tabs handle their own headers
        />
      )}
    </Stack>
  );
}