// theme.js — single source of truth for all design tokens from figma
// import this everywhere instead of hardcoding colors

const theme = {
  colors: {
    // golden gradient stops (used in headers, accents, logo)
    golden: ['#D4A547', '#C4903A', '#A67628'],

    // crimson for primary buttons - dark red like figma shows
    crimson: '#8B0000',
    crimsonPressed: '#6B0000',

    // backgrounds
    bg: '#0D0D0D',        // near black, main bg
    card: '#1A1A1A',      // card surfaces
    cardLight: '#111111',  // lighter card variant (used at 40% opacity sometimes)

    // text
    textPrimary: '#FFFFFF',
    textSecondary: '#C2B59B', // sand color
    textMuted: '#888888',

    // misc
    border: 'rgba(255,255,255,0.1)', // subtle white border
    accent: '#E8C547',    // golden accent for badges, highlights
    success: '#2ECC71',   // green for verified badges
    overlay: 'rgba(0,0,0,0.6)',
  },

  fonts: {
    heading: 'DMSerifDisplay_400Regular',
    body: 'Outfit_400Regular',
    bodyMedium: 'Outfit_500Medium',
    bodySemiBold: 'Outfit_600SemiBold',
  },

  // spacing scale — keeps things consistent
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // border radius presets
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 30,
    full: 999,
  },
};

export default theme;
