import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Box, Paper, BottomNavigation, BottomNavigationAction, CssBaseline, ThemeProvider } from '@mui/material';
import { Settings as SettingsIcon, FitnessCenter, Timeline } from '@mui/icons-material';

import theme from './theme';
import Settings from './pages/Settings';

// Platzhalter für noch nicht existierende Seiten
const WorkoutPlaceholder = () => <Box p={3}>Workout Page (Kommt in Schritt 2)</Box>;
const AnalysisPlaceholder = () => <Box p={3}>Analysis Page (Kommt in Schritt 2)</Box>;

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Bestimmt den aktiven Tab basierend auf der URL
  const getActiveTab = () => {
    if (location.pathname === '/settings') return 2;
    if (location.pathname === '/analysis') return 1;
    return 0; // Default: Workout
  };

  const [value, setValue] = useState(getActiveTab());

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Haupt-Content Bereich */}
      <Box sx={{ pb: 7, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Routes>
          <Route path="/" element={<WorkoutPlaceholder />} />
          <Route path="/analysis" element={<AnalysisPlaceholder />} />
          <Route path="/settings" element={<Settings />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      {/* Untere Navigationsleiste (Mobile Style) */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
            if (newValue === 0) navigate('/');
            if (newValue === 1) navigate('/analysis');
            if (newValue === 2) navigate('/settings');
          }}
        >
          <BottomNavigationAction label="Training" icon={<FitnessCenter />} />
          <BottomNavigationAction label="Analyse" icon={<Timeline />} />
          <BottomNavigationAction label="Einstellungen" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Paper>
    </ThemeProvider>
  );
}
