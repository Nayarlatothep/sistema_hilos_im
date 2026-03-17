import { createStitches } from '@stitches/react';

export const {
  styled,
  css,
  globalCss,
  keyframes,
  getCssText,
  theme,
  createTheme,
  config,
} = createStitches({
  theme: {
    colors: {
      background: '#f8fafc',
      surface: '#ffffff',
      primary: '#0f2643',
      primaryHover: '#0a1a2e',
      secondary: '#7a7a7a',
      accent: '#f37021',
      accentHover: '#de631a',
      text: '#0f2643',
      textLight: '#7a7a7a',
      border: '#e2e8f0',
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      gray50: '#f9fafb',
      gray100: '#f3f4f6',
      gray200: '#e5e7eb',
      gray500: '#6b7280',
      blue50: '#eff6ff',
      orange50: '#fff7ed',
      green50: '#f0fdf4',
      green500: '#22c55e',
      green800: '#166534',
      red50: '#fef2f2',
      red100: '#fee2e2',
      red600: '#dc2626',
      red700: '#b91c1c',
    },
    space: {
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      20: '5rem',
    },
    sizes: {
      maxContent: '1280px', // max-w-7xl
      inputHeight: '48px',
    },
    fonts: {
      body: 'Inter, system-ui, sans-serif',
      heading: 'Inter, system-ui, sans-serif',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    radii: {
      1: '4px',
      2: '8px',
      3: '12px',
      xl: '16px',
      round: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
  },
  media: {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
  },
});

export const globalStyles = globalCss({
  '*': { margin: 0, padding: 0, boxSizing: 'border-box' },
  'body': {
    fontFamily: '$body',
    backgroundColor: '$background',
    color: '$text',
    '-webkit-font-smoothing': 'antialiased',
  },
  'button, input, select': {
    fontFamily: 'inherit',
  }
});
