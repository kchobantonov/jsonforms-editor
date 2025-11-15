/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import { alpha, styled } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import { TreeItem, TreeItemProps } from '@mui/x-tree-view/TreeItem';
import {
  SimpleTreeView,
  SimpleTreeViewProps,
} from '@mui/x-tree-view/SimpleTreeView';
import React from 'react';
import { animated, useSpring } from '@react-spring/web';

const PaletteTransitionComponent = (props: any) => {
  const style = useSpring({
    from: { opacity: 0, transform: 'translate3d(20px,0,0)', filter: 'blur(0)' },
    to: {
      opacity: props.in ? 1 : 0,
      transform: `translate3d(${props.in ? 0 : 20}px,0,0)`,
      filter: 'blur(0)',
    },
  });
  return (
    <animated.div style={style}>
      <Collapse {...props} />
    </animated.div>
  );
};

export const StyledTreeView: React.FC<SimpleTreeViewProps<false>> = styled(
  SimpleTreeView
)<SimpleTreeViewProps<false>>({
  flexGrow: 1,
  maxWidth: 400,
});

interface StyledTreeItemProps extends TreeItemProps {
  isDragging?: boolean;
}

export const StyledTreeItem: React.FC<StyledTreeItemProps> = ({
  isDragging = false,
  ...props
}) => {
  const StyledItem = styled(TreeItem)(({ theme }) => ({
    opacity: isDragging ? 0.5 : 1,
    '& .MuiTreeItem-iconContainer .close': {
      opacity: 0.3,
    },
    '&.MuiTreeItem-group': {
      marginLeft: theme.spacing(1),
      paddingLeft: theme.spacing(2),
      borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
    },
  }));

  return (
    <StyledItem
      {...props}
      slots={{ groupTransition: PaletteTransitionComponent, ...props.slots }}
      slotProps={props.slotProps}
    />
  );
};
