/**
 * Web fallback — react-native-maps is not supported on web.
 * Metro resolves SydneyMap.native.tsx on Android/iOS automatically.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Beach } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";

interface SydneyMapProps {
  beaches: Beach[];
  loading?: boolean;
  onBeachPress?: (beach: Beach) => void;
}

export function SydneyMap({ beaches }: SydneyMapProps) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Surf Hut
      </Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        The live map is available on Android and iOS.
        {"\n"}
        {beaches.length} beaches loaded — use the Beaches tab to browse.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
