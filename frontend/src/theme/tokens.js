/**
 * MediCore design tokens.
 * See /database (root) design notes: deep clinical green + warm clay accent,
 * Fraunces display / Inter body / IBM Plex Mono data — deliberately not the
 * generic teal-SaaS or cream-plus-terracotta AI-default look.
 */
export const colors = {
  ink: '#14213D',
  canvas: '#F7F5F0',
  canvasAlt: '#EFEBE3',
  clinical: '#1B4B43',
  clinicalDark: '#123430',
  clinicalLight: '#2F6459',
  clay: '#E8794F',
  clayDark: '#C85F38',
  clayLight: '#F0A17C',
  vital: '#3FA796',
  slate: '#64748B',
  slateLight: '#94A3B8',
  signal: '#C0392B',
  white: '#FFFFFF',
  border: '#E2DED4',
};

export const fonts = {
  display: '"Fraunces", "Georgia", serif',
  body: '"Inter", "Helvetica Neue", Arial, sans-serif',
  mono: '"IBM Plex Mono", "SFMono-Regular", Menlo, monospace',
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
};

/** Renders the signature EKG waveform stroke as an inline SVG path string, reused across the app. */
export const EKG_PATH =
  'M0,20 L40,20 L55,20 L65,4 L80,36 L92,12 L100,20 L140,20 L160,20 L172,4 L184,36 L196,12 L205,20 L260,20';
