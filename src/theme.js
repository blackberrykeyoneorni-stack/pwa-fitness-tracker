import { createTheme } from '@mui/material/styles';

// MD3 Matte Blue Palette Definition
// Basis: #497CA9
const md3Colors = {
  primary: {
    main: '#497CA9',       // Dein mattes Blau
    light: '#78A9DA',
    dark: '#17527A',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#B0C6D8',       // Ein sehr helles, graues Blau für Akzente
    contrastText: '#0F1D28',
  },
  background: {
    default: '#111318',    // Sehr dunkles Blau-Grau (statt Schwarz)
    paper: '#1A1C23',      // Etwas hellerer Surface-Ton
    subtle: '#242930',     // Für Listen-Elemente / Cards
  },
  error: {
    main: '#FFB4AB',
    container: '#93000A',
  },
  success: {
    main: '#A6D39E',       // Gedecktes Grün passend zum Matten Look
  }
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: md3Colors.primary,
    secondary: md3Colors.secondary,
    error: md3Colors.error,
    success: md3Colors.success,
    background: {
      default: md3Colors.background.default,
      paper: md3Colors.background.paper,
    },
    text: {
      primary: '#E2E2E6',
      secondary: '#C4C6D0',
    },
    // MD3 spezifische Action Colors
    action: {
      active: '#C4C6D0',
      hover: 'rgba(73, 124, 169, 0.08)',
      selected: 'rgba(73, 124, 169, 0.16)',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 500,
      letterSpacing: '0.15px',
    },
    button: {
      textTransform: 'none', // MD3 nutzt kein Uppercase mehr
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
  },
  shape: {
    borderRadius: 16, // MD3 Standard: Größere Radien (Cards 16px, Dialogs 28px)
  },
  components: {
    // --- BUTTONS (Pill Shape) ---
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20, // Pillenform
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: md3Colors.primary.main,
          color: md3Colors.primary.contrastText,
          '&:hover': {
            backgroundColor: md3Colors.primary.light,
          },
        },
        outlined: {
          borderColor: '#78A9DA',
          color: '#78A9DA',
        },
      },
    },
    // --- CARDS & SURFACES ---
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Deaktiviert MUI v5 Overlay
          backgroundColor: md3Colors.background.paper,
        },
        elevation1: {
          backgroundColor: md3Colors.background.subtle, // Tonal Elevation statt Shadow
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: md3Colors.background.subtle,
          border: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    // --- INPUT FIELDS (Filled Variant MD3) ---
    MuiTextField: {
      defaultProps: {
        variant: 'filled',
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderTopLeftRadius: 16, // Oben abgerundet
          borderTopRightRadius: 16,
          '&:before': { display: 'none' }, // Unterstreichung entfernen
          '&:after': { display: 'none' },
          '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            boxShadow: `0 0 0 2px ${md3Colors.primary.main} inset`, // Fokus-Ring innen
          },
        },
      },
    },
    // --- DIALOGS ---
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28, // Sehr rund (MD3 Spec)
          backgroundColor: '#242930',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.5rem',
          textAlign: 'center',
          paddingTop: 24,
        }
      }
    },
    // --- APP BAR ---
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: md3Colors.background.default, // Transparent/Surface
          color: md3Colors.text.primary,
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        },
      },
    },
    // --- FAB (Floating Action Button) ---
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16, // Eckiger "Squircle" statt Kreis (MD3)
          backgroundColor: '#B0C6D8', // Secondary Container
          color: '#0F1D28', // On Secondary Container
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#CDE5F7',
          },
        },
      },
    },
    // --- CHIPS ---
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        filled: {
          backgroundColor: 'rgba(73, 124, 169, 0.2)',
          color: '#D1E4FF',
        }
      }
    }
  },
});

export default theme;