/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import {
  Actions,
  ExportDialog,
  useEditorContext,
  useExportSchema,
  useExportUiSchema,
} from '@chobantonov/jsonforms-editor';
import { ExampleDescription, getExamples } from '@jsonforms/examples';
import CloudDownload from '@mui/icons-material/CloudDownload';
import { FormControl, InputLabel } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

const Title = styled(Typography)({
  flexGrow: 1,
});

const examples = getExamples();

export const Header: React.FC = () => {
  const schema = useExportSchema();
  const uiSchema = useExportUiSchema();
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);
  const openDownloadDialog = () => setOpen(true);

  const dispatch = useEditorContext().dispatch;

  const changeExample = (exampleID: number) => {
    const example = examples[exampleID];

    dispatch(Actions.setSchema(example.schema));
    dispatch(Actions.setUiSchema(example.uischema));
  };

  return (
    <AppBar position='static' elevation={0}>
      <Toolbar>
        <Title variant='h6' color='inherit' noWrap>
          JSON Forms Editor
        </Title>
        <Box display='flex' alignItems='center' gap={1}>
          <FormControl
            fullWidth
            size='small'
            sx={{
              minWidth: 220,
            }}
          >
            <InputLabel
              id='example-select-label'
              sx={{
                color: 'rgba(255,255,255,0.8)',
                '&.Mui-focused': {
                  color: 'white',
                },
              }}
            >
              Example
            </InputLabel>
            <Select
              size='small'
              labelId='example-select-label'
              label='Example'
              onChange={(ev) => changeExample(Number(ev.target.value))}
              variant='outlined'
              sx={{
                color: 'inherit',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white',
                },
                '.MuiSvgIcon-root': {
                  color: 'inherit',
                },
              }}
            >
              {examples.map(
                (optionValue: ExampleDescription, index: number) => (
                  <MenuItem value={index} key={index}>
                    {optionValue.label}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
          <IconButton
            aria-label='Download'
            onClick={openDownloadDialog}
            color='inherit'
          >
            <CloudDownload />
          </IconButton>
        </Box>
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
