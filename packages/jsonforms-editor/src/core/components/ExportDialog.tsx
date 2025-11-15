/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Cancel from '@mui/icons-material/Cancel';
import React, { useState } from 'react';
import { styled } from '@mui/material/styles';

import { FormattedJson } from './Formatted';

const StyledDialogTitle = styled(DialogTitle)({
  textAlign: 'center',
});

const StyledDialogContent = styled(DialogContent)({
  maxHeight: '90vh',
  height: '90vh',
});

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
}));

export interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  schema: any;
  uiSchema: any;
}
export const ExportDialog = ({
  open,
  onClose,
  schema,
  uiSchema,
}: ExportDialogProps) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const handleTabChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    setSelectedTab(newValue);
  };
  return (
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      aria-labelledby='export-dialog-title'
      aria-describedby='export-dialog-description'
      maxWidth='md'
      fullWidth
    >
      <StyledDialogTitle id='export-dialog-title'>{'Export'}</StyledDialogTitle>
      <StyledDialogContent>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label='Schema' />
          <Tab label='UI Schema' />
        </Tabs>
        {selectedTab === 0 && <FormattedJson object={schema} />}
        {selectedTab === 1 && <FormattedJson object={uiSchema} />}
      </StyledDialogContent>
      <DialogActions>
        <StyledButton
          aria-label={'Close'}
          variant='contained'
          color='primary'
          startIcon={<Cancel />}
          onClick={onClose}
        >
          Close
        </StyledButton>
      </DialogActions>
    </Dialog>
  );
};
