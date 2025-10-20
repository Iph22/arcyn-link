/**
 * ARCYN Link Theme Configuration
 * Black/Gold Color Scheme
 */

export const arcynTheme = {
  colors: {
    // Primary Colors
    black: '#000000',
    gold: '#FFD700',
    graphite: '#1A1A1A',
    softGold: '#E2C76B',
    matteGrey: '#2B2B2B',
    
    // Text Colors
    text: '#EAEAEA',
    subtext: '#A1A1A1',
    
    // Semantic Colors
    background: '#000000',
    foreground: '#EAEAEA',
    primary: '#FFD700',
    primaryForeground: '#000000',
    secondary: '#E2C76B',
    secondaryForeground: '#000000',
    accent: '#FFD700',
    accentForeground: '#000000',
    muted: '#2B2B2B',
    mutedForeground: '#A1A1A1',
    card: '#1A1A1A',
    cardForeground: '#EAEAEA',
    border: '#2B2B2B',
    input: '#2B2B2B',
    ring: '#FFD700',
  },
  
  rgb: {
    // RGB values for JavaScript usage
    black: '0, 0, 0',
    gold: '255, 215, 0',
    graphite: '26, 26, 26',
    softGold: '226, 199, 107',
    matteGrey: '43, 43, 43',
    text: '234, 234, 234',
    subtext: '161, 161, 161',
  },
  
  shadows: {
    goldGlow: '0 0 20px rgba(255, 215, 0, 0.3)',
    goldGlowLg: '0 0 40px rgba(255, 215, 0, 0.4)',
    softGoldGlow: '0 0 15px rgba(226, 199, 107, 0.2)',
    cardHover: '0 8px 32px rgba(255, 215, 0, 0.15)',
  },
  
  gradients: {
    goldToSoftGold: 'linear-gradient(to right, #FFD700, #E2C76B)',
    blackToGraphite: 'linear-gradient(to bottom, #000000, #1A1A1A)',
    goldGlow: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
  },
  
  animations: {
    glow: 'glow 2s ease-in-out infinite',
    shimmer: 'shimmer 2s linear infinite',
    fadeIn: 'fadeIn 0.3s ease-out',
  },
  
  fonts: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    display: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
  },
  
  // Component-specific color mappings
  components: {
    sidebar: {
      background: '#1A1A1A',
      border: '#2B2B2B',
      text: '#EAEAEA',
      accent: '#FFD700',
    },
    message: {
      own: {
        background: '#FFD700',
        text: '#000000',
      },
      other: {
        background: '#2B2B2B',
        text: '#EAEAEA',
      },
      ai: {
        background: '#1A1A1A',
        text: '#EAEAEA',
        border: '#FFD700',
        glow: '0 0 20px rgba(255, 215, 0, 0.3)',
      },
    },
    button: {
      primary: {
        background: '#FFD700',
        text: '#000000',
        hover: '#E2C76B',
      },
      secondary: {
        background: '#2B2B2B',
        text: '#EAEAEA',
        border: '#FFD700',
        hover: '#1A1A1A',
      },
      ghost: {
        text: '#EAEAEA',
        hover: '#2B2B2B',
        hoverText: '#FFD700',
      },
    },
    input: {
      background: '#2B2B2B',
      border: '#FFD700',
      text: '#EAEAEA',
      placeholder: '#A1A1A1',
      focus: '#FFD700',
    },
  },
} as const;

export type ArcynTheme = typeof arcynTheme;

// Utility functions for theme usage
export const getThemeColor = (path: string) => {
  const keys = path.split('.');
  let value: any = arcynTheme;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) return null;
  }
  
  return value;
};

export const withOpacity = (color: string, opacity: number) => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export default arcynTheme;
