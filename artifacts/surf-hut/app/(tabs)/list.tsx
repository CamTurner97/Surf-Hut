import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useBeaches } from "@/hooks/useBeaches";
import type { Beach, Region } from "@workspace/api-client-react";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCORE_COLORS: Record<string, string> = {
  Epic: "#E36322",
  Good: "#1F8A8A",
  Fair: "#C4921B",
  Poor: "#8E8E8E",
  Flat: "#B8B0A6",
};

const REGION_LABELS: Record<Region, string> = {
  "northern-beaches": "Northern Beaches",
  "eastern-suburbs": "Eastern Suburbs",
  cronulla: "Cronulla",
};

const REGION_ORDER: Region[] = [
  "northern-beaches",
  "eastern-suburbs",
  "cronulla",
];

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
  const labelColor =
    SCORE_COLORS[beach.latestScoreLabel ?? ""] ?? "#B8B0A6";

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
      <Text
        style={[styles.beachName, { color: colors.foreground }]}
        numberOfLines={1}
      >
        {beach.name}
      </Text>
      {beach.latestScoreLabel ? (
        <View
          style={[
            styles.labelPill,
            { backgroundColor: labelColor + "22" },
          ]}
        >
          <Text style={[styles.labelText, { color: labelColor }]}>
            {beach.latestScoreLabel}
          </Text>
        </View>
      ) : null}
      <Text style={[styles.chevron, { color: colors.mutedForeground }]}>
        ›
      </Text>
    </Pressable>
  );
}

function SectionHeader({
  title,
  collapsed,
  onToggle,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.sectionHeader,
        {
          backgroundColor: pressed ? colors.muted : colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        {title.toUpperCase()}
      </Text>
      <Text style={[styles.sectionChevron, { color: colors.mutedForeground }]}>
        {collapsed ? "›" : "⌄"}
      </Text>
    </Pressable>
  );
}

export default function ListTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch, isRefetching } = useBeaches();

  const toggleSection = useCallback((title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }, []);

  const sections = useMemo(() => {
    const beaches = data?.beaches ?? [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? beaches.filter((b) => b.name.toLowerCase().includes(q))
      : beaches;

    if (q) {
      return filtered.length > 0
        ? [{ title: "Results", data: filtered, collapsed: false }]
        : [];
    }

    return REGION_ORDER.map((region) => {
      const title = REGION_LABELS[region];
      const isCollapsed = collapsed.has(title);
      return {
        title,
        collapsed: isCollapsed,
        data: isCollapsed ? [] : filtered.filter((b) => b.region === region),
      };
    });
  }, [data, query, collapsed]);

  const handlePress = useCallback((beach: Beach) => {
    router.push({ pathname: "/beach/[id]", params: { id: beach.id } });
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading beaches…
        </Text>
      </View>
    );
  }

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.searchWrap,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={[styles.searchBox, { backgroundColor: colors.muted }]}>
          <Text style={[styles.searchIcon, { color: colors.mutedForeground }]}>
            ⌕
          </Text>
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search beaches…"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BeachRow beach={item} onPress={() => handlePress(item)} />
        )}
        renderSectionHeader={({ section }) => (
          <SectionHeader
            title={section.title}
            collapsed={section.collapsed}
            onToggle={() => toggleSection(section.title)}
          />
        )}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              No beaches match "{query}"
            </Text>
          </View>
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
    padding: 32,
    gap: 8,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
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

  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 6,
    height: 38,
  },
  searchIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    paddingVertical: 0,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
  },
  sectionChevron: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "400",
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
  beachName: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
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

  emptyWrap: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
});
