import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform, StyleSheet, Text } from "react-native";

import { GlobeIcon, HeartOutlineIcon } from "@/components/TabIcons";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="list">
        <Icon sf={{ default: "list.bullet", selected: "list.bullet" }} />
        <Label>Beaches</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="favourites">
        <Icon sf={{ default: "heart", selected: "heart.fill" }} />
        <Label>Favourites</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function makeIcon(glyph: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ fontSize: 22, color, lineHeight: 24 }}>{glyph}</Text>
  );
}

function makeSvgIcon(
  Component: React.ComponentType<{ color: string; size?: number }>,
) {
  return ({ color }: { color: string }) => (
    <Component color={color} size={22} />
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: colors.foreground,
          fontFamily: "Inter_600SemiBold",
          fontSize: 17,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: isWeb ? 1 : StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Surf Hut",
          tabBarLabel: "Map",
          tabBarIcon: makeSvgIcon(GlobeIcon),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: "Beaches",
          tabBarLabel: "Beaches",
          tabBarIcon: makeIcon("☰"),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: "Favourites",
          tabBarLabel: "Favourites",
          tabBarIcon: makeSvgIcon(HeartOutlineIcon),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: makeIcon("⚙"),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
