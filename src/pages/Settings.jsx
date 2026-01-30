import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import { db } from '../db';
import { exportData, importData } from '../utils/exportManager';

const DAYS_OF_WEEK = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag'
];

const Settings = () => {
  const [settings, setSettings] = useState({
    userName: '',
    trainingDays: [],
    reminderTime: '18:00'
  });
  const [status, setStatus] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await db.settings.get('user_settings');
      if (savedSettings) {
        setSettings(savedSettings.value);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      await db.settings.put({ id: 'user_settings', value: settings });
      setStatus({ open: true, message: 'Einstellungen gespeichert!', severity: 'success' });
    } catch (error) {
      setStatus({ open: true, message: 'Fehler beim Speichern', severity: 'error' });
    }
  };

  const handleDayChange = (event) => {
    const {
      target: { value },
    } = event;
    setSettings({
      ...settings,
      // Bei Multiple-Select ist value ein Array
      trainingDays: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleExport = async () => {
    const success = await exportData();
    if (success) {
      setStatus({ open: true, message: 'Daten erfolgreich exportiert!', severity: 'success' });
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const success = await importData(file);
    if (success) {
      setStatus({ open: true, message: 'Daten erfolgreich importiert!', severity: 'success' });
      window.location.reload();
    } else {
      setStatus({ open: true, message: 'Fehler beim Importieren', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Einstellungen
      </Typography>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Profil</Typography>
        <TextField
          fullWidth
          label="Name"
          value={settings.userName}
          onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
          margin="normal"
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>Trainingstage</Typography>
        <FormControl fullWidth margin="normal">
          <InputLabel id="training-days-label">Wochentage</InputLabel>
          <Select
            labelId="training-days-label"
            id="training-days-select"
            multiple
            value={settings.trainingDays}
            onChange={handleDayChange}
            input={<OutlinedInput label="Wochentage" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} color="primary" size="small" />
                ))}
              </Box>
            )}
          >
            {DAYS_OF_WEEK.map((day) => (
              <MenuItem key={day} value={day}>
                {day}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Erinnerungszeit"
          type="time"
          value={settings.reminderTime}
          onChange={(e) => setSettings({ ...settings, reminderTime: e.target.value })}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />

        <Button
          fullWidth
          variant="contained"
          onClick={handleSave}
          sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
        >
          Speichern
        </Button>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Daten-Management</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
          <Button variant="outlined" onClick={handleExport}>
            Daten Exportieren (.json)
          </Button>
          <Button variant="outlined" component="label">
            Daten Importieren
            <input type="file" hidden accept=".json" onChange={handleImport} />
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={status.open}
        autoHideDuration={4000}
        onClose={() => setStatus({ ...status, open: false })}
      >
        <Alert severity={status.severity} variant="filled">
          {status.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;