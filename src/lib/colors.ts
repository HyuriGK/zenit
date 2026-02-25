export const colors = {
  // Background
  background: "#0A0A0F",
  surface: "#18181b",
  surfaceLight: "#27272a",

  // Text
  textPrimary: "#ffffff",
  textSecondary: "#d4d4d8",
  textMuted: "#71717a",

  // Brand
  emerald: "#10B981",
  blue: "#3B82F6",
  cyan: "#06B6D4",

  // Status
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",

  // Border
  border: "#27272a",
} as const;

export type ColorKey = keyof typeof colors;
