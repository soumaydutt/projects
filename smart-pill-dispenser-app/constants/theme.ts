import { Platform } from "react-native";

const primaryLight = "#0A84FF";
const primaryDark = "#0A84FF";

export const Colors = {
  light: {
    primary: "#0A84FF",
    secondary: "#30D5C8",
    success: "#34C759",
    warning: "#FF9500",
    error: "#FF3B30",
    text: "#000000",
    textSecondary: "#8E8E93",
    buttonText: "#FFFFFF",
    tabIconDefault: "#8E8E93",
    tabIconSelected: primaryLight,
    link: "#0A84FF",
    backgroundRoot: "#F8FAFD",
    backgroundDefault: "#F8FAFD",
    backgroundSecondary: "#FFFFFF",
    backgroundTertiary: "#F2F2F7",
    card: "#FFFFFF",
  },
  dark: {
    primary: "#0A84FF",
    secondary: "#30D5C8",
    success: "#32D74B",
    warning: "#FF9F0A",
    error: "#FF453A",
    text: "#FFFFFF",
    textSecondary: "#98989D",
    buttonText: "#FFFFFF",
    tabIconDefault: "#98989D",
    tabIconSelected: primaryDark,
    link: "#0A84FF",
    backgroundRoot: "#0E0E0F",
    backgroundDefault: "#0E0E0F",
    backgroundSecondary: "#1C1C1E",
    backgroundTertiary: "#2C2C2E",
    card: "#1C1C1E",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: "700" as const,
  },
  title1: {
    fontSize: 28,
    fontWeight: "600" as const,
  },
  title2: {
    fontSize: 22,
    fontWeight: "600" as const,
  },
  headline: {
    fontSize: 17,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 17,
    fontWeight: "400" as const,
  },
  callout: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  footnote: {
    fontSize: 13,
    fontWeight: "400" as const,
  },
};

export const Shadow = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fab: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
