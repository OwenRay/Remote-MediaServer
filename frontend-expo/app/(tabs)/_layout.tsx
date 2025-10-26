import { Tabs } from 'expo-router';
import React from 'react';
import { useTheme } from '@react-navigation/native';

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabLayout() {
  const navTheme = useTheme();

  return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: navTheme.colors.text,
          tabBarActiveBackgroundColor: navTheme.colors.card,
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="house" color={color} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color }) => (
              <MaterialIcons size={28} name="movie" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="settings" color={color} />,
          }}
        />
      </Tabs>
  );
}
