import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useBeaches } from "@/hooks/useBeaches";
import { SydneyMap } from "@/components/map/SydneyMap";
import type { Beach } from "@workspace/api-client-react";

export default function MapTab() {
  const colors = useColors();
  const { data, isLoading, error } = useBeaches();

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Could not load beaches.
        </Text>
        <Text style={[styles.errorHint, { color: colors.mutedForeground }]}>
          Check your connection and try again.
        </Text>
      </View>
    );
  }

  const beaches: Beach[] = data?.beaches ?? [];

  function handleBeachPress(beach: Beach) {
    // Beach detail screen coming in T11
    console.log("Tapped:", beach.id);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SydneyMap
        beaches={beaches}
        loading={isLoading}
        onBeachPress={handleBeachPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  errorText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    textAlign: "center",
  },
  errorHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
});
