export const colors = {
  primary: "#FF3737",
  primaryHover: "#ED1515",
  secondary: "#008B74",
  secondaryHover: "#006F5D",
  text: "#202124",
  textMuted: "#4A4A4A",
  textSecondary: "#848484",
  background: "#FAFAFA",
  surface: "#FFFFFF",
  border: "#EDEDED",
  success: "#00C950",
  error: "#FB2C36",
  info: "#2B7FFF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: "#202124",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  soft: {
    shadowColor: "#202124",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
