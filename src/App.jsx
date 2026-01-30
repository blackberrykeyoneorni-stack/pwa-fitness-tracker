import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Box, Paper, BottomNavigation, BottomNavigationAction, CssBaseline, ThemeProvider } from '@mui/material';
import { Settings as SettingsIcon, FitnessCenter, Timeline } from '@mui/icons-material';

import theme from './theme';
import Settings from './pages/Settings';
import Workout from './pages/Workout';
import Analysis from './pages/Analysis';

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
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100dvh', // Nutzt die volle Höhe inklusive Systemleisten
          overflow: 'hidden',
          bgcolor: 'background.default'
        }}
      >
        
        {/* Scrollbarer Inhaltsbereich */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden',
            /* Verhindert, dass Inhalt hinter die untere Leiste rutscht */
            pb: 2 
          }}
        >
          <Routes>
            <Route path="/" element={<Workout />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>

        {/* Fixierte Fußleiste mit Safe-Area-Padding */}
        <Paper 
          elevation={3} 
          sx={{ 
            zIndex: 1000, 
            borderRadius: 0,
            /* Der entscheidende Fix für Android 16 Navigationsleisten: */
            paddingBottom: 'env(safe-area-inset-bottom)',
            bgcolor: 'background.paper'
          }}
        >
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
      </Box>

    </ThemeProvider>
  );
}