import { createTheme } from '@mui/material/styles';
import { colors, fonts, radii } from './tokens';

/**
 * Builds the MUI theme for a given mode. Dark mode inverts canvas/ink but
 * keeps the clinical green + clay accent pairing so the brand reads the
 * same in both.
 */
export function buildTheme(mode = 'light') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.clinical,
        dark: colors.clinicalDark,
        light: colors.clinicalLight,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: colors.clay,
        dark: colors.clayDark,
        light: colors.clayLight,
        contrastText: '#FFFFFF',
      },
      error: {
        main: colors.signal,
      },
      success: {
        main: colors.vital,
      },
      background: {
        default: isDark ? '#0F1A17' : colors.canvas,
        paper: isDark ? '#16221E' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F1EFE9' : colors.ink,
        secondary: isDark ? colors.slateLight : colors.slate,
      },
      divider: isDark ? 'rgba(241,239,233,0.12)' : colors.border,
    },
    shape: {
      borderRadius: radii.md,
    },
    typography: {
      fontFamily: fonts.body,
      h1: { fontFamily: fonts.display, fontWeight: 600, letterSpacing: '-0.02em' },
      h2: { fontFamily: fonts.display, fontWeight: 600, letterSpacing: '-0.01em' },
      h3: { fontFamily: fonts.display, fontWeight: 600 },
      h4: { fontFamily: fonts.display, fontWeight: 600 },
      h5: { fontFamily: fonts.body, fontWeight: 700 },
      h6: { fontFamily: fonts.body, fontWeight: 700 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
      overline: { fontFamily: fonts.mono, letterSpacing: '0.08em' },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: radii.sm,
            paddingInline: 20,
            paddingBlock: 10,
          },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: radii.lg,
            border: `1px solid ${isDark ? 'rgba(241,239,233,0.08)' : colors.border}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: radii.sm,
            fontWeight: 600,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${isDark ? 'rgba(241,239,233,0.08)' : colors.border}`,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: colors.slate,
          },
        },
      },
    },
  });
}

export default buildTheme;
