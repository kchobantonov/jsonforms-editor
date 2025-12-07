/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import { DialogContent, Fade, Typography } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import * as monaco from 'monaco-editor';
import React, { useCallback, useMemo } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { styled } from '@mui/material/styles';

import {
  configureJsonSchemaValidation,
  EditorApi,
  getMonacoModelForUri,
  TextType,
} from '../jsonSchemaValidation';

const StyledDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    height: '100%',
    minHeight: '95vh',
    maxHeight: '95vh',
  },
});

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  overflow: 'hidden',
  marginTop: theme.spacing(2),
  flex: 1,
}));

const StyledAppBar = styled(AppBar)({
  position: 'relative',
});

const StyledToolbar = styled(Toolbar)({
  display: 'flex',
  justifyContent: 'space-between',
});

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Fade ref={ref} {...props} />;
});

interface JsonEditorDialogProps {
  open: boolean;
  title: string;
  initialContent: any;
  type: TextType;
  onApply: (newContent: any) => void;
  onCancel: () => void;
}

export const JsonEditorDialog: React.FC<JsonEditorDialogProps> = ({
  open,
  title,
  initialContent,
  type,
  onApply,
  onCancel,
}) => {
  const modelUri = monaco.Uri.parse('json://core/specification/schema.json');

  const configureEditor = useCallback(
    (editor: EditorApi) => {
      if (type === 'JSON Schema') {
        configureJsonSchemaValidation(editor, modelUri);
      }
    },
    [type, modelUri]
  );

  const model = useMemo(
    () => getMonacoModelForUri(modelUri, initialContent),
    [initialContent, modelUri]
  );

  const setModel = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      if (!model.isDisposed()) {
        editor.setModel(model);
      }
    },
    [model]
  );

  return (
    <StyledDialog
      open={open}
      onClose={onCancel}
      maxWidth='lg'
      fullWidth
      slots={{
        transition: Transition,
      }}
    >
      <StyledAppBar>
        <StyledToolbar>
          <IconButton
            edge='start'
            color='inherit'
            onClick={onCancel}
            aria-label='cancel'
            data-cy='cancel'
          >
            <CloseIcon />
          </IconButton>
          <Typography variant='h6' color='inherit' noWrap>
            {title} Text Edit
          </Typography>
          <Button
            variant='contained'
            onClick={() => onApply(model.getValue())}
            data-cy='apply'
          >
            Apply
          </Button>
        </StyledToolbar>
      </StyledAppBar>
      <StyledDialogContent>
        <MonacoEditor
          language='json'
          editorDidMount={(editor) => {
            setModel(editor);
            editor.focus();
          }}
          editorWillMount={configureEditor}
        />
      </StyledDialogContent>
    </StyledDialog>
  );
};
