import { useThemeContext } from "@/contexts/ThemeContext";

export function useTheme() {
  const ctx = useThemeContext();

  return {
    colors: ctx.colors,
    theme: ctx.colors,
    isDark: ctx.isDark,
    themeName: ctx.themeName,
    setTheme: ctx.setTheme,
    toggleTheme: ctx.toggleTheme,
  };
}
