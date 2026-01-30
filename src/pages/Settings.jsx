import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, WEEKDAYS } from '../db';
import { exportData } from '../utils/exportManager';
import {
  Box, Typography, Tabs, Tab, List, ListItem, ListItemText,
  IconButton, Fab, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Card, CardContent, Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as CsvIcon,
  DataObject as JsonIcon
} from '@mui/icons-material';

export default function Settings() {
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    day: WEEKDAYS[0],
    targetSets: 3,
    targetReps: 10,
    targetWeight: 0,
    restTime: 60 // Standard: 60 Sekunden Pause
  });

  const exercises = useLiveQuery(() => db.exercises.toArray());
  const currentDayName = WEEKDAYS[currentTab];
  const daysExercises = exercises?.filter(ex => ex.day === currentDayName) || [];

  const handleOpen = (exercise = null) => {
    if (exercise) {
      setEditingId(exercise.id);
      setFormData({
        name: exercise.name,
        day: exercise.day,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        targetWeight: exercise.targetWeight,
        restTime: exercise.restTime || 60
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        day: currentDayName,
        targetSets: 3,
        targetReps: 10,
        targetWeight: 0,
        restTime: 60
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    const dataToSave = {
        ...formData,
        targetSets: Number(formData.targetSets),
        targetReps: Number(formData.targetReps),
        targetWeight: Number(formData.targetWeight),
        restTime: Number(formData.restTime)
    };

    if (editingId) {
      await db.exercises.update(editingId, dataToSave);
    } else {
      await db.exercises.add(dataToSave);
    }
    setOpenDialog(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Übung wirklich löschen?')) {
      await db.exercises.delete(id);
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      <Typography variant="h5" sx={{ mb: 2, px: 2, pt: 2, fontWeight: 'bold' }}>
        Einstellungen
      </Typography>

      {/* Export */}
      <Card sx={{ mx: 2, mb: 3, borderRadius: 4, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Datenverwaltung
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<CsvIcon />} onClick={() => exportData('csv')} fullWidth>
              CSV
            </Button>
            <Button variant="outlined" startIcon={<JsonIcon />} onClick={() => exportData('json')} fullWidth>
              JSON
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ px: 2, mb: 1 }}>Trainingsplan</Typography>

      <Tabs
        value={currentTab}
        onChange={(e, v) => setCurrentTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        {WEEKDAYS.map((day) => <Tab key={day} label={day} />)}
      </Tabs>

      <List sx={{ px: 2 }}>
        {daysExercises.map((ex) => (
          <Card key={ex.id} sx={{ mb: 1, borderRadius: 3 }}>
            <ListItem
              secondaryAction={
                <Box>
                  <IconButton onClick={() => handleOpen(ex)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(ex.id)} color="error"><DeleteIcon /></IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={ex.name}
                secondary={
                    <React.Fragment>
                        <Typography variant="body2" component="span" display="block">
                            {ex.targetSets} x {ex.targetReps} Wdh {ex.targetWeight > 0 && `@ +${ex.targetWeight}kg`}
                        </Typography>
                        <Chip label={`${ex.restTime || 60}s Pause`} size="small" sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} />
                    </React.Fragment>
                }
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          </Card>
        ))}
      </List>

      <Fab color="primary" sx={{ position: 'fixed', bottom: 90, right: 16 }} onClick={() => handleOpen(null)}>
        <AddIcon />
      </Fab>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingId ? 'Übung bearbeiten' : 'Neue Übung'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Wochentag</InputLabel>
              <Select value={formData.day} label="Wochentag" onChange={(e) => setFormData({ ...formData, day: e.target.value })}>
                {WEEKDAYS.map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Sätze" type="number" fullWidth value={formData.targetSets} onChange={(e) => setFormData({ ...formData, targetSets: e.target.value })} />
              <TextField label="Ziel Wdh." type="number" fullWidth value={formData.targetReps} onChange={(e) => setFormData({ ...formData, targetReps: e.target.value })} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Zusatzgewicht (kg)" type="number" fullWidth value={formData.targetWeight} onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })} />
                <TextField label="Pause (sek)" type="number" fullWidth value={formData.restTime} onChange={(e) => setFormData({ ...formData, restTime: e.target.value })} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained">Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}