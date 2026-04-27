import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { useColors } from "@/hooks/useColors";

const REGIONS = [
  { name: "Northern Beaches", count: 13 },
  { name: "Eastern Suburbs", count: 4 },
  { name: "Cronulla", count: 3 },
];

export default function ListTab() {
  const colors = useColors();
  return (
    <PlaceholderScreen
      icon="list"
      title="Every spot, sorted"
      body="Browse all 20 surf beaches from Palm Beach in the north down to Cronulla Point. Search by name, sort by score."
      accent="accent"
      footer="LIST VIEW  ·  COMING IN PHASE 2"
    >
      <View style={[styles.regions, { borderColor: colors.border }]}>
        {REGIONS.map((r, i) => (
          <View
            key={r.name}
            style={[
              styles.row,
              i < REGIONS.length - 1 && {
                borderBottomColor: colors.border,
                borderBottomWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <Text style={[styles.region, { color: colors.foreground }]}>
              {r.name}
            </Text>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {r.count}
            </Text>
          </View>
        ))}
      </View>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  regions: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  region: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  count: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
