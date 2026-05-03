import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Callout, Marker, type Region } from "react-native-maps";

import type { Beach } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { BeachPin } from "./BeachPin";
import { pinColor, type ScoreLabel } from "./scoreColor";

const SYDNEY_REGION: Region = {
  latitude: -33.86,
  longitude: 151.21,
  latitudeDelta: 0.9,
  longitudeDelta: 0.65,
};

interface SydneyMapProps {
  beaches: Beach[];
  loading?: boolean;
  onBeachPress?: (beach: Beach) => void;
}

function ScoreBadge({ label }: { label: string | null | undefined }) {
  if (!label) return null;
  const color = pinColor(label as ScoreLabel);
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function SydneyMap({ beaches, loading, onBeachPress }: SydneyMapProps) {
  const colors = useColors();
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleMarkerPress = useCallback((beach: Beach) => {
    setSelectedId(beach.id);
  }, []);

  const handleCalloutPress = useCallback(
    (beach: Beach) => {
      onBeachPress?.(beach);
    },
    [onBeachPress],
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={SYDNEY_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        mapType="standard"
      >
        {beaches.map((beach) => (
          <Marker
            key={beach.id}
            coordinate={{
              latitude: beach.latitude,
              longitude: beach.longitude,
            }}
            onPress={() => handleMarkerPress(beach)}
            tracksViewChanges={false}
          >
            <BeachPin
              score={beach.latestScore}
              label={beach.latestScoreLabel}
              size={selectedId === beach.id ? 38 : 32}
            />
            <Callout tooltip onPress={() => handleCalloutPress(beach)}>
              <View
                style={[
                  styles.callout,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.calloutName, { color: colors.foreground }]}
                >
                  {beach.name}
                </Text>
                <View style={styles.calloutRow}>
                  <ScoreBadge label={beach.latestScoreLabel} />
                  {beach.latestScore != null && (
                    <Text
                      style={[
                        styles.calloutScore,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {beach.latestScore}/10
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.calloutHint,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Tap for full report →
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {loading && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator color={colors.primary} size="large" />
          <Text
            style={[styles.loadingText, { color: colors.mutedForeground }]}
          >
            Checking the surf…
          </Text>
        </View>
      )}

      {/* Score legend */}
      <View
        style={[
          styles.legend,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {(
          [
            { label: "Epic", color: "#E36322" },
            { label: "Good", color: "#1F8A8A" },
            { label: "Fair", color: "#C4921B" },
            { label: "Poor", color: "#8E8E8E" },
          ] as const
        ).map(({ label, color }) => (
          <View key={label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text
              style={[styles.legendLabel, { color: colors.foreground }]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  callout: {
    width: 200,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  calloutName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  calloutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calloutScore: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  calloutHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  legend: {
    position: "absolute",
    bottom: 24,
    right: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});
