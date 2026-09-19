import React, { createContext, useContext, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const NAVY    = '#1e3a5f'; // Deep navy — primary brand
const NAVY_LT = '#2d5a9e'; // Lighter navy for hover states
const AMBER   = '#f59e0b'; // Warm amber — CTA / highlights
const AMBER_D = '#d97706'; // Darker amber for hover

const LIGHT = {
  bg:         '#f8fafc',   // Page background
  surface:    '#ffffff',   // Card / paper surface
  border:     '#e2e8f0',   // Subtle dividers
  textPri:    '#0f172a',   // Headlines
  textSec:    '#475569',   // Body / captions
  textDis:    '#cbd5e1',   // Disabled
};
// ─────────────────────────────────────────────────────────────────────────────

interface ThemeContextType {
  mode: 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
          primary: {
            main:          NAVY,
            light:         NAVY_LT,
            dark:          '#132840',
            contrastText:  '#ffffff',
          },
          secondary: {
            main:          AMBER,
            light:         '#fcd34d',
            dark:          AMBER_D,
            contrastText:  '#ffffff',
          },
          warning: { main: AMBER },
          success: { main: '#10b981' },
          error:   { main: '#ef4444' },
          background: {
            default: LIGHT.bg,
            paper:   LIGHT.surface,
          },
          text: {
            primary:   LIGHT.textPri,
            secondary: LIGHT.textSec,
            disabled:  LIGHT.textDis,
          },
          divider: LIGHT.border,
        },

        typography: {
          fontFamily: '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          h1: { fontWeight: 800, letterSpacing: '-0.04em' },
          h2: { fontWeight: 700, letterSpacing: '-0.03em' },
          h3: { fontWeight: 700, letterSpacing: '-0.02em' },
          h4: { fontWeight: 700, letterSpacing: '-0.01em' },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
          body1: { lineHeight: 1.7 },
          body2: { lineHeight: 1.65 },
          button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
        },

        shape: { borderRadius: 10 },

        components: {
          // ── Buttons ─────────────────────────────────────────────────────
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '9px 22px',
                transition: 'all 0.2s ease',
                boxShadow: 'none',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(30, 58, 95, 0.18)',
                },
              },
              contained: {
                background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_LT} 100%)`,
                color: '#ffffff',
                '&:hover': {
                  background: `linear-gradient(135deg, ${NAVY_LT} 0%, ${NAVY} 100%)`,
                },
                '&.Mui-disabled': {
                  background: LIGHT.border,
                  color: LIGHT.textDis,
                },
              },
              outlined: {
                borderColor: LIGHT.border,
                color: LIGHT.textPri,
                '&:hover': {
                  borderColor: NAVY,
                  background: 'rgba(30, 58, 95, 0.04)',
                  color: NAVY,
                },
              },
              text: {
                color: NAVY,
                '&:hover': {
                  background: 'rgba(30, 58, 95, 0.05)',
                },
              },
            },
          },

          // ── Cards ────────────────────────────────────────────────────────
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 14,
                backgroundImage: 'none',
                backgroundColor: LIGHT.surface,
                border: `1px solid ${LIGHT.border}`,
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 32px rgba(30, 58, 95, 0.12)',
                  borderColor: '#c7d7eb',
                },
              },
            },
          },

          // ── Paper ────────────────────────────────────────────────────────
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backgroundColor: LIGHT.surface,
              },
            },
          },

          // ── AppBar ───────────────────────────────────────────────────────
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: LIGHT.textPri,
              },
            },
          },

          // ── Chip ────────────────────────────────────────────────────────
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 6,
                fontWeight: 600,
              },
            },
          },

          // ── TextField ───────────────────────────────────────────────────
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: LIGHT.border },
                  '&:hover fieldset': { borderColor: '#94a3b8' },
                  '&.Mui-focused fieldset': {
                    borderColor: NAVY,
                    borderWidth: '1.5px',
                  },
                },
              },
            },
          },

          // ── Divider ─────────────────────────────────────────────────────
          MuiDivider: {
            styleOverrides: {
              root: { borderColor: LIGHT.border },
            },
          },

          // ── Tabs ────────────────────────────────────────────────────────
          MuiTabs: {
            styleOverrides: {
              indicator: {
                backgroundColor: NAVY,
                height: 2,
                borderRadius: '2px 2px 0 0',
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                color: LIGHT.textSec,
                fontWeight: 500,
                '&.Mui-selected': { color: NAVY, fontWeight: 700 },
              },
            },
          },

          // ── Slider ──────────────────────────────────────────────────────
          MuiSlider: {
            styleOverrides: {
              root: { color: NAVY },
            },
          },

          // ── Dialog ──────────────────────────────────────────────────────
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 16,
                boxShadow: '0 24px 64px rgba(15, 23, 42, 0.15)',
              },
            },
          },
        },
      }),
    []
  );

  return (
    <ThemeContext.Provider value={{ mode: 'light' }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within ThemeProvider');
  return context;
};
