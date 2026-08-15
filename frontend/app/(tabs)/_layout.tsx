import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Buddies',
          // ... tab icon settings
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'All Goals',
          // ... tab icon settings
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Global Camera',
          headerShown: false, // optional: hide tab header if camera goes full screen
        }}
      />
    </Tabs>
  );
}