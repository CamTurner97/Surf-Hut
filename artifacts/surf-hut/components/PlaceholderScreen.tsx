import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const GLYPHS = {
  map: "◉",
  list: "☰",
  heart: "♥",
  settings: "⚙",
} as const;

type GlyphKey = keyof typeof GLYPHS;

type PlaceholderScreenProps = {
  icon: GlyphKey;
  title: string;
  body: string;
  accent?: "primary" | "accent";
  footer?: string;
  children?: React.ReactNode;
};

export function PlaceholderScreen({
  icon,
  title,
  body,
  accent = "primary",
  footer,
  children,
}: PlaceholderScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tint = accent === "primary" ? colors.primary : colors.accent;
  const tintBg =
    accent === "primary"
      ? "rgba(227, 99, 34, 0.08)"
      : "rgba(31, 138, 138, 0.08)";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              insets.bottom +
              (Platform.OS === "web" ? 100 : 90),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.center}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: tintBg,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.iconGlyph, { color: tint }]}>
              {GLYPHS[icon]}
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {body}
          </Text>
          {children ? <View style={styles.children}>{children}</View> : null}
        </View>
        {footer ? (
          <Text style={[styles.footer, { color: colors.mutedForeground }]}>
            {footer}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
    justifyContent: "space-between",
  },
  center: {
    alignItems: "center",
    paddingTop: 24,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconGlyph: {
    fontSize: 40,
    lineHeight: 44,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },
  children: {
    marginTop: 28,
    width: "100%",
    alignItems: "center",
  },
  footer: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 32,
    letterSpacing: 0.2,
  },
});
