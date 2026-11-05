export const THEMES = [
  { value: "system", label: "Match my device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "sepia", label: "Sepia" },
  { value: "midnight", label: "Midnight" },
];

export const THEME_VALUES = THEMES.filter((theme) => theme.value !== "system").map(
  (theme) => theme.value,
);
