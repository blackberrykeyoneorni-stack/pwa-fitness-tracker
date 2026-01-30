import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Box, Paper, BottomNavigation, BottomNavigationAction, CssBaseline, ThemeProvider } from '@mui/material';
import { Settings as SettingsIcon, FitnessCenter, Timeline } from '@mui/icons-material';

import theme from './theme';
import Settings from './pages/Settings';
import Workout from './pages/Workout';   // <--- Import Neu
import Analysis from './pages/Analysis'; // <--- Import Neu

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getActiveTab = () => {
    if (location.pathname === '/settings') return 2;
    if (location.pathname === '/analysis') return 1;
    return 0; 
  };

  const [value, setValue] = useState(getActiveTab());

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <Box sx={{ pb: 7, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Routes>
          <Route path="/" element={<Workout />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

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