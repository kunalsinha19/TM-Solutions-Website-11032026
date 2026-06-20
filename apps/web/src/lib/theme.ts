export const themeModes = ["light", "dark", "green"] as const;
export type ThemeMode = (typeof themeModes)[number];
