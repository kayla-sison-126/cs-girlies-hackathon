import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
  <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="friendship/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}