import { Tabs } from 'expo-router';
import React from 'react';
import { useTheme } from '@react-navigation/native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabLayout() {
  const navTheme = useTheme();

  return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: navTheme.colors.text,
          tabBarActiveBackgroundColor: navTheme.colors.card,
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="books.vertical.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
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
