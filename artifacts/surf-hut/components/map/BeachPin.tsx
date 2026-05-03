import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { pinColor, type ScoreLabel } from "./scoreColor";

interface BeachPinProps {
  score: number | null | undefined;
  label: ScoreLabel | string | null | undefined;
  size?: number;
}

/**
 * A round surf-score pin used as a custom Marker on the map.
 * Shows the numeric score (or "?" when no data yet).
 */
export function BeachPin({ score, label, size = 32 }: BeachPinProps) {
  const bg = pinColor(label);
  const text = score != null ? String(score) : "?";

  return (
    <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          shadowColor: bg,
        },
      ]}
    >
      <Text style={[styles.score, { fontSize: size * 0.4 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  score: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    lineHeight: undefined,
  },
});
