import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeartFilledIcon, HeartOutlineIcon } from "@/components/TabIcons";
import { useBeaches } from "@/hooks/useBeaches";
import { useFavourites } from "@/hooks/useFavourites";
import { useColors } from "@/hooks/useColors";
import { SydneyMap } from "@/components/map/SydneyMap";
import type { Beach } from "@workspace/api-client-react";

export default function MapTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useBeaches();
  const { favouriteIds } = useFavourites();
  const [favOnly, setFavOnly] = useState(false);

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

  const allBeaches: Beach[] = data?.beaches ?? [];
  const beaches = favOnly
    ? allBeaches.filter((b) => favouriteIds.includes(b.id))
    : allBeaches;

  function handleBeachPress(beach: Beach) {
    router.push({ pathname: "/beach/[id]", params: { id: beach.id } });
  }

  const hasFavourites = favouriteIds.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SydneyMap
        beaches={beaches}
        loading={isLoading}
        onBeachPress={handleBeachPress}
      />

      {/* Favourites filter toggle — only shown once at least one beach is saved */}
      {hasFavourites && (
        <Pressable
          onPress={() => setFavOnly((v) => !v)}
          style={[
            styles.toggleBtn,
            {
              top: insets.top + 12,
              backgroundColor: favOnly ? colors.primary : colors.card,
              borderColor: favOnly ? colors.primary : colors.border,
              shadowColor: "#000",
            },
          ]}
        >
          {favOnly ? (
            <HeartFilledIcon color="#FFFFFF" size={16} />
          ) : (
            <HeartOutlineIcon color={colors.mutedForeground} size={16} />
          )}
          <Text
            style={[
              styles.toggleLabel,
              { color: favOnly ? "#FFFFFF" : colors.mutedForeground },
            ]}
          >
            {favOnly ? "My spots" : "My spots"}
          </Text>
        </Pressable>
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
  toggleBtn: {
    position: "absolute",
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
