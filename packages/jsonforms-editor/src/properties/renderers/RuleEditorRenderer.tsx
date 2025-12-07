/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */

import { ControlProps, rankWith, scopeEndsWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  FormHelperText,
  Grid,
  Typography,
  styled,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as monaco from 'monaco-editor';
import React, { useCallback, useMemo, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';

import { ShowMoreLess } from '../../core/components';
import {
  configureRuleSchemaValidation,
  EditorApi,
  getMonacoModelForUri,
} from '../../text-editor/jsonSchemaValidation';

const invalidJsonMessage = 'Not a valid rule JSON.';
const ruleDescription =
  'Define conditions and effects that can dynamically control features of the UI based on data.';

const ruleExample = (
  <div>
    <h3>Example</h3>
    <p>
      A rule that hides the UI Element it is contained in, when the value of the
      control with the scope <b>'#/properties/name'</b> is <b>'foo'</b>:
    </p>
    <pre>
      {JSON.stringify(
        {
          effect: 'HIDE',
          condition: {
            type: 'LEAF',
            scope: '#/properties/name',
            expectedValue: 'foo',
          },
        },
        null,
        2
      )}
    </pre>
    <p>
      Visit the{' '}
      <a href='https://jsonforms.io/docs/uischema/rules'>
        JSON Forms documentation
      </a>{' '}
      for more info.
    </p>
  </div>
);

const isValidRule = (rule: any) => {
  return !rule || (rule.effect && rule.condition);
};

const EditorContainer = styled('div')({
  width: '100%',
});

const StyledShowMoreLess = styled(ShowMoreLess)(({ theme }) => ({
  paddingBottom: theme.spacing(2),
}));

const RuleEditor: React.FC<ControlProps> = (props) => {
  const { data, path, handleChange, errors } = props;
  const [invalidJson, setInvalidJson] = useState(false);
  const modelUri = monaco.Uri.parse('json://core/specification/rules.json');

  const configureEditor = useCallback(
    (editor: EditorApi) => {
      configureRuleSchemaValidation(editor, modelUri);
    },
    [modelUri]
  );

  const model = useMemo(
    () => getMonacoModelForUri(modelUri, JSON.stringify(data, null, 2)),
    [data, modelUri]
  );

  const setModel = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      if (!model.isDisposed()) {
        editor.setModel(model);
      }
    },
    [model]
  );

  const onSubmitRule = useCallback(() => {
    try {
      const value = model.getValue();
      const rule = value ? JSON.parse(value) : undefined;
      if (isValidRule(rule)) {
        setInvalidJson(false);
        handleChange(path, rule);
      } else {
        setInvalidJson(true);
      }
    } catch (error) {
      setInvalidJson(true);
    }
  }, [handleChange, model, path]);

  const isValid = errors.length === 0 && !invalidJson;

  return (
    <Accordion defaultExpanded={!!data}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Rule</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <EditorContainer>
          <FormHelperText error={false}>{ruleDescription}</FormHelperText>
          <StyledShowMoreLess>
            <FormHelperText error={false}>{ruleExample}</FormHelperText>
          </StyledShowMoreLess>

          <MonacoEditor
            language='json'
            editorWillMount={configureEditor}
            editorDidMount={setModel}
            height={200}
            options={{
              formatOnPaste: true,
              formatOnType: true,
              automaticLayout: true,
            }}
          />
          <Grid container direction='row' spacing={2} alignItems='center'>
            <Grid>
              <Button variant='contained' onClick={onSubmitRule}>
                Apply
              </Button>
            </Grid>
            <Grid>
              <FormHelperText error={true} hidden={isValid}>
                {errors.length !== 0 ? errors : invalidJsonMessage}
              </FormHelperText>
            </Grid>
          </Grid>
        </EditorContainer>
      </AccordionDetails>
    </Accordion>
  );
};

const RuleEditorRenderer = RuleEditor;
export const RuleEditorRendererRegistration = {
  tester: rankWith(100, scopeEndsWith('rule')),
  renderer: withJsonFormsControlProps(RuleEditorRenderer),
};
