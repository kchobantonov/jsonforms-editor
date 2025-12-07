/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */

import { GroupLayout, LayoutProps, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { Card, CardContent, CardHeader, Grid, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

import { EditorLayout } from '../model/uischema';
import { DroppableLayout } from './DroppableLayout';

const GroupHeader = styled(Grid)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(1),
  alignItems: 'baseline',
  padding: theme.spacing(2),
}));

const LabelTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'hasLabel',
})<{ hasLabel: boolean }>(({ hasLabel, theme }) => {
  if (hasLabel) {
    return {};
  }
  return {
    fontStyle: 'italic',
    fontWeight: theme.typography.fontWeightLight,
    color: theme.palette.grey[500],
  };
});

const Group: React.FC<LayoutProps> = (props) => {
  const { uischema } = props;
  const groupLayout = uischema as GroupLayout & EditorLayout;

  return (
    <Card>
      <CardHeader
        component={() => (
          <GroupHeader>
            <Typography>Label:</Typography>
            <LabelTypography variant='h6' hasLabel={!!groupLayout.label}>
              {groupLayout.label ?? 'no label'}
            </LabelTypography>
          </GroupHeader>
        )}
      />
      <CardContent>
        <DroppableLayout {...props} layout={groupLayout} direction='column' />
      </CardContent>
    </Card>
  );
};

export const DroppableGroupLayoutRegistration = {
  tester: rankWith(45, uiTypeIs('Group')),
  renderer: withJsonFormsLayoutProps(Group),
};
