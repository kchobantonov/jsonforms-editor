/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  LayoutProps,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import { Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useDrop } from 'react-dnd';

import { useDispatch, useSchema } from '../context';
import {
  canDropIntoLayout,
  canMoveSchemaElementTo,
  MOVE_UI_SCHEMA_ELEMENT,
  MoveUISchemaElement,
  NEW_UI_SCHEMA_ELEMENT,
  NewUISchemaElement,
} from '../dnd';
import { Actions } from '../model';
import {
  EditorLayout,
  EditorUISchemaElement,
  getUISchemaPath,
} from '../model/uischema';
import { isPathError } from '../util/schemasUtil';
import { DroppableElementRegistration } from './DroppableElement';

interface DroppableLayoutProps {
  schema: JsonSchema;
  layout: EditorLayout;
  path: string;
  direction: 'row' | 'column';
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
}

const GridItem = styled(Grid)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
});

export const DroppableLayout: React.FC<DroppableLayoutProps> = ({
  schema,
  layout,
  path,
  direction,
  renderers,
  cells,
}) => {
  return (
    <Grid
      container
      direction={direction}
      spacing={direction === 'row' ? 2 : 0}
      wrap='nowrap'
    >
      <DropPoint index={0} layout={layout} key={`${path}-${0}-drop`} />
      {layout.elements.map((child, index) => (
        <React.Fragment key={`${path}-${index}-fragment`}>
          <GridItem>
            <JsonFormsDispatch
              uischema={child}
              schema={schema}
              path={path}
              renderers={
                renderers
                  ? [...renderers, DroppableElementRegistration]
                  : undefined
              }
              cells={cells}
            />
          </GridItem>
          <DropPoint
            index={index + 1}
            layout={layout}
            key={`${path}-${index + 1}-drop`}
          />
        </React.Fragment>
      ))}
    </Grid>
  );
};

interface DropPointProps {
  layout: EditorLayout;
  index: number;
}

const DropPointGrid = styled(Grid, {
  shouldForwardProp: (prop) => prop !== 'isOver' && prop !== 'fillWidth',
})<{ isOver: boolean; fillWidth: boolean }>(({ theme, isOver, fillWidth }) => ({
  padding: theme.spacing(1),
  backgroundImage: isOver
    ? 'radial-gradient(#c8c8c8 1px, transparent 1px)'
    : 'none',
  backgroundSize: 'calc(10 * 1px) calc(10 * 1px)',
  backgroundClip: 'content-box',
  minWidth: '2em',
  minHeight: isOver ? '8em' : '2em',
  maxWidth: fillWidth || isOver ? 'inherit' : '2em',
}));

const DropPoint: React.FC<DropPointProps> = ({ layout, index }) => {
  const dispatch = useDispatch();
  const rootSchema = useSchema();

  const [{ isOver, uiSchemaElement, schemaUUID }, drop] = useDrop<
    NewUISchemaElement | MoveUISchemaElement,
    void,
    {
      isOver: boolean;
      uiSchemaElement: EditorUISchemaElement;
      schemaUUID?: string;
    }
  >({
    accept: [NEW_UI_SCHEMA_ELEMENT, MOVE_UI_SCHEMA_ELEMENT],
    canDrop: (item) => {
      switch (item.type) {
        case NEW_UI_SCHEMA_ELEMENT:
          return canDropIntoLayout(
            item as NewUISchemaElement,
            rootSchema,
            layout
          );
        case MOVE_UI_SCHEMA_ELEMENT:
          return canMoveSchemaElementTo(
            item as MoveUISchemaElement,
            layout,
            index
          );
      }
      // fallback
      return false;
    },
    collect: (monitor) => {
      const item = monitor.getItem();
      return {
        isOver: !!monitor.isOver() && monitor.canDrop(),
        uiSchemaElement: item?.uiSchemaElement,
        schemaUUID:
          item && item.type === NEW_UI_SCHEMA_ELEMENT
            ? item.schemaUUID
            : undefined,
      };
    },
    drop: (item) => {
      switch (item.type) {
        case NEW_UI_SCHEMA_ELEMENT:
          schemaUUID
            ? dispatch(
                Actions.addScopedElementToLayout(
                  uiSchemaElement,
                  layout.uuid,
                  index,
                  schemaUUID
                )
              )
            : dispatch(
                Actions.addUnscopedElementToLayout(
                  uiSchemaElement,
                  layout.uuid,
                  index
                )
              );
          break;
        case MOVE_UI_SCHEMA_ELEMENT:
          dispatch(
            Actions.moveUiSchemaElement(
              uiSchemaElement.uuid,
              layout.uuid,
              index,
              schemaUUID
            )
          );
          break;
      }
    },
  });

  const fillWidth =
    layout.type !== 'HorizontalLayout' || layout.elements.length === 0;

  return (
    <DropPointGrid
      container
      ref={drop}
      isOver={isOver}
      fillWidth={fillWidth}
      data-cy={`${getDataPath(layout)}-drop-${index}`}
    />
  );
};

const getDataPath = (uischema: EditorUISchemaElement): string => {
  const path = getUISchemaPath(uischema);
  if (isPathError(path)) {
    console.error('Could not calculate data-cy path for DropPoint', path);
    return '';
  }
  return path;
};

const createRendererInDirection =
  (direction: 'row' | 'column') =>
  ({ uischema, path, renderers, ...props }: LayoutProps) => {
    const layout = uischema as EditorLayout;
    return (
      <DroppableLayout
        {...props}
        path={path}
        layout={layout}
        direction={direction}
        renderers={renderers}
      />
    );
  };

export const DroppableHorizontalLayoutRegistration = {
  tester: rankWith(45, uiTypeIs('HorizontalLayout')),
  renderer: withJsonFormsLayoutProps(createRendererInDirection('row')),
};
export const DroppableVerticalLayoutRegistration = {
  tester: rankWith(45, uiTypeIs('VerticalLayout')),
  renderer: withJsonFormsLayoutProps(createRendererInDirection('column')),
};
