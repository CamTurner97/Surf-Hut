import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { useColors } from "@/hooks/useColors";

export default function MapTab() {
  const colors = useColors();
  return (
    <PlaceholderScreen
      icon="map"
      title="Sydney conditions, at a glance"
      body="A live map of Sydney's surf coast is coming next. Tap any beach pin to see the wave height, wind, swell and weather right now."
      accent="primary"
      footer="20 BEACHES  ·  POWERED BY OPEN-METEO"
    >
      <View style={[styles.legend, { borderColor: colors.border }]}>
        <View style={styles.legendRow}>
          <View
            style={[styles.dot, { backgroundColor: colors.accent }]}
          />
          <Text
            style={[styles.legendLabel, { color: colors.foreground }]}
          >
            Firing
          </Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text
            style={[styles.legendLabel, { color: colors.foreground }]}
          >
            Worth a paddle
          </Text>
        </View>
        <View style={styles.legendRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: colors.mutedForeground },
            ]}
          />
          <Text
            style={[styles.legendLabel, { color: colors.foreground }]}
          >
            Flat / blown out
          </Text>
        </View>
      </View>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  legend: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
