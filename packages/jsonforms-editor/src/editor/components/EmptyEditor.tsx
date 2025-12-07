/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import React from 'react';
import { Typography, styled } from '@mui/material';
import { useDrop } from 'react-dnd';

import { useDispatch } from '../../core/context';
import { NEW_UI_SCHEMA_ELEMENT, NewUISchemaElement } from '../../core/dnd';
import { Actions } from '../../core/model';

interface RootProps {
  isOver: boolean;
}

const Root = styled('div')<RootProps>(({ isOver }) => ({
  padding: 10,
  fontSize: isOver ? '1.1em' : '1em',
  border: isOver ? '1px solid #D3D3D3' : 'none',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const EmptyEditor: React.FC = () => {
  const dispatch = useDispatch();

  const [{ isOver }, drop] = useDrop<
    NewUISchemaElement,
    void,
    { isOver: boolean; uiSchemaElement: NewUISchemaElement | undefined }
  >({
    accept: NEW_UI_SCHEMA_ELEMENT,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      uiSchemaElement: monitor.getItem(),
    }),
    drop: (item) => {
      if (item?.uiSchemaElement) {
        dispatch(Actions.setUiSchema(item.uiSchemaElement));
      }
    },
  });

  return (
    <Root ref={drop} isOver={isOver}>
      <Typography data-cy='nolayout-drop'>
        Drag and drop an element from the Palette to begin.
      </Typography>
    </Root>
  );
};
