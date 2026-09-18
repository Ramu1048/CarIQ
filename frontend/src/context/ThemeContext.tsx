import React, { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';

interface ThemeContextType {
  mode: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#00e5ff', // Electric Cyber Cyan
            light: '#6effff',
            dark: '#00b2cc',
            contrastText: '#000000',
          },
          secondary: {
            main: '#ff3366', // Crimson Racing Red
            light: '#ff6699',
            dark: '#cc0033',
            contrastText: '#ffffff',
          },
          warning: {
            main: '#ffb703', // Amber Gold
          },
          success: {
            main: '#00e676', // Performance Green
          },
          background: {
            default: mode === 'dark' ? '#070b14' : '#f8fafc',
            paper: mode === 'dark' ? '#0f172a' : '#ffffff',
          },
          text: {
            primary: mode === 'dark' ? '#f1f5f9' : '#0f172a',
            secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
          },
        },
        typography: {
          fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          h1: { fontWeight: 800, letterSpacing: '-0.03em' },
          h2: { fontWeight: 700, letterSpacing: '-0.02em' },
          h3: { fontWeight: 700, letterSpacing: '-0.02em' },
          h4: { fontWeight: 600, letterSpacing: '-0.01em' },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
          button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                padding: '10px 22px',
                transition: 'all 0.25s ease-in-out',
                boxShadow: 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(0, 229, 255, 0.25)',
                },
              },
              contained: {
                background: 'linear-gradient(135deg, #00e5ff 0%, #0072ff 100%)',
                color: '#ffffff',
                '&:hover': {
                  background: 'linear-gradient(135deg, #33ebff 0%, #1a82ff 100%)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                backgroundImage: 'none',
                backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.75)' : '#ffffff',
                backdropFilter: 'blur(16px)',
                border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: mode === 'dark'
                    ? '0 16px 32px -8px rgba(0, 229, 255, 0.15)'
                    : '0 16px 32px -8px rgba(0, 0, 0, 0.1)',
                  borderColor: 'rgba(0, 229, 255, 0.3)',
                },
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
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
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
