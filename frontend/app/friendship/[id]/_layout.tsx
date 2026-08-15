import { Stack } from 'expo-router';

export default function FriendshipLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#2D3436',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Friend Home' }} />
      <Stack.Screen name="shop" options={{ title: 'Pet Shop', presentation: 'modal' }} />
    </Stack>
  );
}