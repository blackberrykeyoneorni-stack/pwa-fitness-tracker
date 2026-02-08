import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#479CA9', // M3 Purple 80
      contrastText: '#381E72',
    },
    secondary: {
      main: '#CCC2DC', // M3 Purple Grey 80
      contrastText: '#332D41',
    },
    tertiary: {
      main: '#EFB8C8', // M3 Pink 80
      contrastText: '#492532',
    },
    background: {
      default: '#141218', // M3 Dark Background
      paper: '#1D1B20',   // Surface
    },
    error: {
      main: '#F2B8B5',
    },
  },
  shape: {
    borderRadius: 8, // Etwas weniger rund
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Keine Overlays, cleaner Look
          boxShadow: '0px 1px 2px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Lesbarer
          borderRadius: 12, // Weniger rund
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default theme;
