/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CloudDownload from '@mui/icons-material/CloudDownload';
import React, { useState } from 'react';
import { styled } from '@mui/material/styles';

import { useExportSchema, useExportUiSchema } from '../util/hooks';
import { ExportDialog } from './ExportDialog';

const Title = styled(Typography)({
  flexGrow: 1,
});

export const Header: React.FC = () => {
  const schema = useExportSchema();
  const uiSchema = useExportUiSchema();
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);
  const openDownloadDialog = () => setOpen(true);

  return (
    <AppBar position='static' elevation={0}>
      <Toolbar>
        <Title variant='h6' color='inherit' noWrap>
          JSON Forms Editor
        </Title>
        <IconButton
          aria-label='Download'
          onClick={openDownloadDialog}
          color='inherit'
        >
          <CloudDownload />
        </IconButton>
      </Toolbar>
      {open && (
        <ExportDialog
          open={open}
          onClose={onClose}
          schema={schema}
          uiSchema={uiSchema}
        />
      )}
    </AppBar>
  );
};
