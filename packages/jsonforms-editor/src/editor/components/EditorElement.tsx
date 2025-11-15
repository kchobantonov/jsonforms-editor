/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */

import { Grid, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React from 'react';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { styled } from '@mui/material/styles';

import { OkCancelDialog } from '../../core/components/OkCancelDialog';
import { useDispatch, useSchema, useSelection } from '../../core/context';
import { DndItems, MOVE_UI_SCHEMA_ELEMENT } from '../../core/dnd';
import { SchemaIcon, UISchemaIcon } from '../../core/icons';
import { Actions } from '../../core/model';
import {
  EditorUISchemaElement,
  getUISchemaPath,
  hasChildren,
} from '../../core/model/uischema';
import { isEditorControl, tryFindByUUID } from '../../core/util/schemasUtil';

export interface EditorElementProps {
  wrappedElement: EditorUISchemaElement;
  elementIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const Root = styled(Grid, {
  shouldForwardProp: (prop) => prop !== 'isDragging' && prop !== 'isSelected',
})<{ isDragging: boolean; isSelected: boolean }>(
  ({ theme, isDragging, isSelected }) => ({
    border: isSelected ? '1px solid #a9a9a9' : '1px solid #d3d3d3',
    backgroundColor: isSelected ? 'rgba(63,81,181,0.08)' : '#fafafa',
    padding: theme.spacing(1),
    width: '100%',
    alignSelf: 'baseline',
    minWidth: 'fit-content',
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    flexDirection: 'column',
  })
);

const ElementHeader = styled(Grid)({
  display: 'flex',
  flexDirection: 'row',
  '&:hover .elementControls': {
    opacity: 1,
  },
});

const ElementControls = styled(Grid)({
  opacity: 0,
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: 4,
});

const Rule = styled(Typography)(({ theme }) => ({
  fontWeight: 'bolder',
  marginRight: theme.spacing(0.5),
  marginLeft: theme.spacing(1),
}));

const RuleEffect = styled(Typography)(({ theme }) => ({
  fontStyle: 'italic',
  color: theme.palette.text.secondary,
}));

export const EditorElement: React.FC<EditorElementProps> = ({
  wrappedElement,
  elementIcon,
  children,
}) => {
  const schema = useSchema();
  const [selection, setSelection] = useSelection();
  const dispatch = useDispatch();
  const [openConfirmRemoveDialog, setOpenConfirmRemoveDialog] =
    React.useState(false);

  const elementSchema = tryFindByUUID(
    schema,
    wrappedElement.linkedSchemaElement
  );

  const [{ isDragging }, drag] = useDrag<
    ReturnType<typeof DndItems.moveUISchemaElement>,
    void,
    { isDragging: boolean }
  >({
    type: MOVE_UI_SCHEMA_ELEMENT,
    item: DndItems.moveUISchemaElement(wrappedElement, elementSchema),
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const uiPath = getUISchemaPath(wrappedElement);
  const isSelected = selection?.uuid === wrappedElement.uuid;
  const ruleEffect = wrappedElement.rule?.effect.toLocaleUpperCase();

  const icon =
    elementIcon ??
    (elementSchema ? (
      <SchemaIcon type={elementSchema.type} />
    ) : (
      <UISchemaIcon type={wrappedElement.type} />
    ));

  return (
    <Root
      data-cy={`editorElement-${uiPath}`}
      ref={drag}
      isDragging={isDragging}
      isSelected={isSelected}
      onClick={(event) => {
        event.stopPropagation();
        setSelection({ uuid: wrappedElement.uuid });
      }}
    >
      <ElementHeader data-cy={`editorElement-${uiPath}-header`}>
        <Grid
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 0.5,
            flexGrow: 1,
          }}
        >
          {icon}
          {ruleEffect && (
            <Grid
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Rule variant='subtitle2'>{'R'}</Rule>
              <RuleEffect variant='caption'>{`(${ruleEffect})`}</RuleEffect>
            </Grid>
          )}
          {isEditorControl(wrappedElement) && (
            <Grid
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <RuleEffect variant='caption'>{wrappedElement.scope}</RuleEffect>
            </Grid>
          )}
        </Grid>
        <ElementControls className='elementControls'>
          <IconButton
            data-cy={`editorElement-${uiPath}-removeButton`}
            size='small'
            onClick={() => {
              hasChildren(wrappedElement)
                ? setOpenConfirmRemoveDialog(true)
                : dispatch(Actions.removeUiSchemaElement(wrappedElement.uuid));
            }}
          >
            <DeleteIcon />
          </IconButton>

          <OkCancelDialog
            open={openConfirmRemoveDialog}
            text={'Remove element and all its contents from the UI Schema?'}
            onOk={() => {
              dispatch(Actions.removeUiSchemaElement(wrappedElement.uuid));
              setOpenConfirmRemoveDialog(false);
            }}
            onCancel={() => setOpenConfirmRemoveDialog(false)}
          />
        </ElementControls>
      </ElementHeader>
      {children}
    </Root>
  );
};
