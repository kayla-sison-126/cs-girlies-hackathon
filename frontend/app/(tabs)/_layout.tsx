import { useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { setLastTab } from '../../lib/lastTab';

export default function GlobalTabLayout() {
  const pathname = usePathname();

  // Save the current tab whenever the route changes (ignoring the camera)
  useEffect(() => {
    if (pathname && !pathname.includes('camera')) {
      setLastTab(pathname);
    }
  }, [pathname]);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF7675',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarStyle:
          route.name === 'camera'
            ? { display: 'none' }
            : undefined,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Buddies',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'All Goals',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Global Camera',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}