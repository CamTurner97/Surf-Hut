import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeartOutlineIcon } from "@/components/TabIcons";
import { useBeaches } from "@/hooks/useBeaches";
import { useFavourites } from "@/hooks/useFavourites";
import { useColors } from "@/hooks/useColors";
import type { Beach } from "@workspace/api-client-react";

const SCORE_COLORS: Record<string, string> = {
  Epic: "#E36322",
  Good: "#1F8A8A",
  Fair: "#C4921B",
  Poor: "#8E8E8E",
  Flat: "#B8B0A6",
};

function ScoreBadge({
  score,
  label,
}: {
  score?: number | null;
  label?: string | null;
}) {
  const color = SCORE_COLORS[label ?? ""] ?? "#B8B0A6";
  return (
    <View style={[styles.scoreBadge, { backgroundColor: color }]}>
      <Text style={styles.scoreBadgeText}>{score ?? "—"}</Text>
    </View>
  );
}

function BeachRow({
  beach,
  onPress,
}: {
  beach: Beach;
  onPress: () => void;
}) {
  const colors = useColors();
  const labelColor = SCORE_COLORS[beach.latestScoreLabel ?? ""] ?? "#B8B0A6";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.muted : colors.card,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={onPress}
    >
      <ScoreBadge score={beach.latestScore} label={beach.latestScoreLabel} />
      <View style={styles.rowCenter}>
        <Text
          style={[styles.beachName, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {beach.name}
        </Text>
        <Text style={[styles.regionName, { color: colors.mutedForeground }]}>
          {beach.region.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </Text>
      </View>
      {beach.latestScoreLabel ? (
        <View
          style={[styles.labelPill, { backgroundColor: labelColor + "22" }]}
        >
          <Text style={[styles.labelText, { color: labelColor }]}>
            {beach.latestScoreLabel}
          </Text>
        </View>
      ) : null}
      <Text style={[styles.chevron, { color: colors.mutedForeground }]}>›</Text>
    </Pressable>
  );
}

function EmptyState() {
  const colors = useColors();
  return (
    <View style={styles.emptyWrap}>
      <HeartOutlineIcon color={colors.border} size={48} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        No favourites yet
      </Text>
      <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
        Tap the heart on any beach to save your home breaks here.
      </Text>
    </View>
  );
}

export default function FavouritesTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useBeaches();
  const { favouriteIds } = useFavourites();

  const favourites = (data?.beaches ?? []).filter((b) =>
    favouriteIds.includes(b.id),
  );

  const handlePress = useCallback((beach: Beach) => {
    router.push({ pathname: "/beach/[id]", params: { id: beach.id } });
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={favourites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BeachRow beach={item} onPress={() => handlePress(item)} />
        )}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={
          favourites.length === 0
            ? styles.emptyContainer
            : { paddingBottom: insets.bottom + 16 }
        }
        showsVerticalScrollIndicator={false}
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
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scoreBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scoreBadgeText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  rowCenter: {
    flex: 1,
    gap: 2,
  },
  beachName: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  regionName: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textTransform: "capitalize",
  },
  labelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  labelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "300",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  emptyWrap: {
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
  },
  emptyBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
});
