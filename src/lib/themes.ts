export type ThemeMode = "light" | "dark";

export interface AppTheme {
  id: string;
  name: string;
  mode: ThemeMode;
  /** Preview swatch colors for the theme picker */
  swatch: [string, string, string];
  description: string;
}

export const APP_THEMES: AppTheme[] = [
  { id: "pearl", name: "Pearl", mode: "light", swatch: ["#f8fafc", "#e2e8f0", "#0f172a"], description: "Clean & luminous" },
  { id: "obsidian", name: "Obsidian", mode: "dark", swatch: ["#0c0a09", "#292524", "#fafaf9"], description: "Deep charcoal elegance" },
  { id: "midnight", name: "Midnight", mode: "dark", swatch: ["#0f172a", "#1e3a5f", "#38bdf8"], description: "Starlit navy depths" },
  { id: "aurora", name: "Aurora", mode: "dark", swatch: ["#0d1117", "#134e4a", "#2dd4bf"], description: "Northern lights glow" },
  { id: "sunset", name: "Sunset", mode: "dark", swatch: ["#1c1917", "#c2410c", "#fb923c"], description: "Warm dusk horizon" },
  { id: "ocean", name: "Ocean", mode: "light", swatch: ["#f0f9ff", "#0284c7", "#0ea5e9"], description: "Coastal serenity" },
  { id: "forest", name: "Forest", mode: "light", swatch: ["#f0fdf4", "#15803d", "#166534"], description: "Verdant woodland calm" },
  { id: "lavender", name: "Lavender", mode: "light", swatch: ["#faf5ff", "#9333ea", "#c084fc"], description: "Soft purple haze" },
  { id: "rose-gold", name: "Rose Gold", mode: "light", swatch: ["#fff1f2", "#e11d48", "#fda4af"], description: "Blush metallic warmth" },
  { id: "cyberpunk", name: "Cyberpunk", mode: "dark", swatch: ["#090014", "#d946ef", "#22d3ee"], description: "Neon future pulse" },
  { id: "sakura", name: "Sakura", mode: "light", swatch: ["#fdf2f8", "#ec4899", "#fbcfe8"], description: "Cherry blossom bloom" },
  { id: "arctic", name: "Arctic", mode: "light", swatch: ["#f8fafc", "#64748b", "#94a3b8"], description: "Frosted minimalism" },
  { id: "ember", name: "Ember", mode: "dark", swatch: ["#1a0a00", "#ea580c", "#fbbf24"], description: "Smoldering firelight" },
  { id: "neon", name: "Neon", mode: "dark", swatch: ["#030712", "#84cc16", "#a3e635"], description: "Electric lime night" },
  { id: "monaco", name: "Monaco", mode: "dark", swatch: ["#18181b", "#dc2626", "#fafafa"], description: "Grand prix luxury" },
  { id: "dracula", name: "Dracula", mode: "dark", swatch: ["#282a36", "#bd93f9", "#ff79c6"], description: "Classic code aesthetic" },
  { id: "nord", name: "Nord", mode: "dark", swatch: ["#2e3440", "#5e81ac", "#88c0d0"], description: "Arctic polar frost" },
  { id: "solar", name: "Solar", mode: "light", swatch: ["#fdf6e3", "#b58900", "#268bd2"], description: "Sun-drenched clarity" },
  { id: "matrix", name: "Matrix", mode: "dark", swatch: ["#0a0f0a", "#22c55e", "#4ade80"], description: "Digital rain green" },
  { id: "coral", name: "Coral", mode: "light", swatch: ["#fff7ed", "#f97316", "#fdba74"], description: "Tropical reef warmth" },
  { id: "sapphire", name: "Sapphire", mode: "dark", swatch: ["#0c1445", "#2563eb", "#60a5fa"], description: "Precious blue depth" },
  { id: "amethyst", name: "Amethyst", mode: "dark", swatch: ["#1e1033", "#7c3aed", "#a78bfa"], description: "Regal violet crystal" },
  { id: "mint", name: "Mint", mode: "light", swatch: ["#ecfdf5", "#10b981", "#6ee7b7"], description: "Fresh spring breeze" },
  { id: "copper", name: "Copper", mode: "dark", swatch: ["#1c1410", "#b45309", "#d97706"], description: "Artisan metal craft" },
  { id: "slate", name: "Slate", mode: "light", swatch: ["#f1f5f9", "#475569", "#334155"], description: "Professional precision" },
  { id: "crimson", name: "Crimson", mode: "dark", swatch: ["#1a0505", "#dc2626", "#f87171"], description: "Bold dramatic power" },
  { id: "golden-hour", name: "Golden Hour", mode: "light", swatch: ["#fffbeb", "#d97706", "#f59e0b"], description: "Magic hour radiance" },
  { id: "deep-space", name: "Deep Space", mode: "dark", swatch: ["#030014", "#6366f1", "#818cf8"], description: "Cosmic indigo void" },
  { id: "tropical", name: "Tropical", mode: "light", swatch: ["#ecfeff", "#06b6d4", "#14b8a6"], description: "Island paradise vibe" },
  { id: "royal", name: "Royal", mode: "dark", swatch: ["#0f0720", "#eab308", "#fde047"], description: "Imperial gold majesty" },
];

export const THEME_IDS = APP_THEMES.map((t) => t.id);

export const DEFAULT_THEME_ID = "pearl";

export function getThemeById(id: string): AppTheme | undefined {
  return APP_THEMES.find((t) => t.id === id);
}

export function getThemeMode(id: string): ThemeMode {
  return getThemeById(id)?.mode ?? "light";
}
