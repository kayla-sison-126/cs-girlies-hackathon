import { Tabs, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function FriendTabLayout() {
  const { id } = useLocalSearchParams();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4A90E2',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
      }}
    >
      {/* Tab 1: Pet Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pet Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="paw" size={size} color={color} />,
        }}
      />

      {/* Tab 2: Friend Goals & Add Goal */}
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Pair Goals',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />

      {/* Tab 3: Pet Shop & Try-On */}
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Pet Shop',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}