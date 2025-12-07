/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import Typography from '@mui/material/Typography';
import React from 'react';
import { useDrag } from 'react-dnd';

import { PaletteElement } from '../../core/api/paletteService';
import { DndItems, NEW_UI_SCHEMA_ELEMENT } from '../../core/dnd';
import { EditorUISchemaElement } from '../../core/model/uischema';
import { StyledTreeItem, StyledTreeView } from './Tree';

interface UiSchemaTreeItemProps {
  uiSchemaElementProvider: () => EditorUISchemaElement;
  type: string;
  label: string;
  icon?: React.ReactNode;
}

const UiSchemaTreeItem: React.FC<UiSchemaTreeItemProps> = ({
  uiSchemaElementProvider,
  type,
  label,
  icon,
}) => {
  const [{ isDragging }, drag] = useDrag<
    ReturnType<typeof DndItems.newUISchemaElement>,
    void,
    { isDragging: boolean }
  >({
    type: NEW_UI_SCHEMA_ELEMENT,
    item: DndItems.newUISchemaElement(uiSchemaElementProvider()),
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });
  return (
    <div ref={drag} data-cy={`${type}-source`}>
      <StyledTreeItem
        key={type}
        itemId={type}
        label={label}
        slots={{ icon: () => icon }}
        isDragging={isDragging}
      ></StyledTreeItem>
    </div>
  );
};

interface UIElementsTreeProps {
  className?: string;
  elements: PaletteElement[];
}

export const UIElementsTree: React.FC<UIElementsTreeProps> = ({
  className,
  elements,
}) => {
  return (
    <div className={className}>
      <Typography variant='h6' color='inherit' noWrap>
        Layouts & Other
      </Typography>
      <StyledTreeView defaultExpandedItems={['']}>
        {elements.map(({ type, label, icon, uiSchemaElementProvider }) => (
          <UiSchemaTreeItem
            key={`treeitem-${type}`}
            type={type}
            label={label}
            icon={icon}
            uiSchemaElementProvider={uiSchemaElementProvider}
          />
        ))}
      </StyledTreeView>
    </div>
  );
};
