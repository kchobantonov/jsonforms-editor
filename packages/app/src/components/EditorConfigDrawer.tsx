import {
  Box,
  Drawer,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
  Divider,
} from '@mui/material';
import React from 'react';
import { EditorConfig, saveConfig } from '../config/editorConfig';

interface Props {
  open: boolean;
  onClose: () => void;
  config: EditorConfig;
  onChange: (config: EditorConfig) => void;
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'bg', label: 'Български' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'ja', label: '日本語' },
];

export const EditorConfigDrawer: React.FC<Props> = ({
  open,
  onClose,
  config,
  onChange,
}) => {
  const update = (partial: Partial<EditorConfig>) => {
    const next = { ...config, ...partial };
    onChange(next);
    saveConfig(next);
  };

  return (
    <Drawer anchor='right' open={open} onClose={onClose}>
      <Box width={320} p={2}>
        <Typography variant='h6' gutterBottom>
          Configuration
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <FormControl fullWidth size='small' sx={{ mb: 2 }}>
          <InputLabel>Theme</InputLabel>
          <Select
            label='Theme'
            value={config.themeMode}
            onChange={(e) => update({ themeMode: e.target.value as any })}
          >
            <MenuItem value='system'>System</MenuItem>
            <MenuItem value='light'>Light</MenuItem>
            <MenuItem value='dark'>Dark</MenuItem>
          </Select>
        </FormControl>

        {/* Language */}
        <FormControl fullWidth size='small' sx={{ mb: 2 }}>
          <InputLabel>Language</InputLabel>
          <Select
            label='Language'
            value={config.language}
            onChange={(e) => update({ language: e.target.value })}
          >
            {languages.map(({ code, label }) => (
              <MenuItem key={code} value={code}>
                {label}
              </MenuItem>
            ))}{' '}
          </Select>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        <Typography variant='subtitle1' gutterBottom>
          Enabled Renderers
        </Typography>

        <FormGroup>
          {[
            'react-material',
            'react-vanilla',
            'vue-vuetify',
            'vue-vanilla',
            'angular-material',
          ].map((id) => (
            <FormControlLabel
              key={id}
              control={
                <Switch
                  checked={config.enabledRenderers.includes(id)}
                  onChange={(e) => {
                    update({
                      enabledRenderers: e.target.checked
                        ? [...config.enabledRenderers, id]
                        : config.enabledRenderers.filter((r) => r !== id),
                    });
                  }}
                />
              }
              label={id}
            />
          ))}
        </FormGroup>
      </Box>
    </Drawer>
  );
};
