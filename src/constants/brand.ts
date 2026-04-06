// Piano Pals — Brand Identity
export const BRAND = {
  name: 'Piano Pals',
  tagline: 'Learn piano, have fun',
} as const;

// Simplified color palette: coral + gold + neutrals
export const COLORS = {
  // Primary — coral (THE brand color)
  primary: '#FF6B6B',
  primaryLight: '#FF8A8A',
  primaryDark: '#E85555',
  primaryGlow: 'rgba(255, 107, 107, 0.4)',

  // Gold — achievements, stars, coins only
  gold: '#FFD700',
  goldDark: '#B8860B',
  goldGlow: 'rgba(255, 215, 0, 0.5)',

  // Backgrounds
  bgPrimary: '#0F0B1A',
  bgCard: '#1A1530',
  bgElevated: '#231D40',

  // Text
  textPrimary: '#F5F0FF',
  textSecondary: '#9B96A8',
  textMuted: '#635E78',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
} as const;
