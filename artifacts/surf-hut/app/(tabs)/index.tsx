import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useBeaches } from "@/hooks/useBeaches";
import { useFavourites } from "@/hooks/useFavourites";
import { HeartFilledIcon, HeartOutlineIcon } from "@/components/TabIcons";
import { SydneyMap } from "@/components/map/SydneyMap";
import type { Beach } from "@workspace/api-client-react";

export default function MapTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useBeaches();
  const { favouriteIds } = useFavourites();
  const [showFavsOnly, setShowFavsOnly] = useState(false);

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
    router.push({ pathname: "/beach/[id]", params: { id: beach.id } });
  }

  const hasFavourites = favouriteIds.length > 0;
  const filterIds = showFavsOnly ? favouriteIds : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SydneyMap
        beaches={beaches}
        loading={isLoading}
        onBeachPress={handleBeachPress}
        filterIds={filterIds}
      />

      {hasFavourites && (
        <View
          style={[styles.pillWrapper, { top: insets.top + 12 }]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => setShowFavsOnly((v) => !v)}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: showFavsOnly
                  ? colors.primary
                  : colors.card,
                borderColor: showFavsOnly ? colors.primary : colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            {showFavsOnly ? (
              <HeartFilledIcon color="#fff" size={14} />
            ) : (
              <HeartOutlineIcon color={colors.primary} size={14} />
            )}
            <Text
              style={[
                styles.pillLabel,
                { color: showFavsOnly ? "#fff" : colors.primary },
              ]}
            >
              My spots
            </Text>
          </Pressable>
        </View>
      )}
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
  pillWrapper: {
    position: "absolute",
    left: 16,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  pillLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
