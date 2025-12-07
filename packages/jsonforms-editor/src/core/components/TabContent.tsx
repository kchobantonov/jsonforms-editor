/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import React from 'react';
import { styled } from '@mui/material/styles';

export interface TabContentProps {
  children?: React.ReactNode;
  index: number;
  currentIndex: number;
}

const TabContentDiv = styled('div')(({ theme }) => ({
  padding: theme.spacing(1, 1, 0, 1),
  height: '100%',
  overflow: 'auto',
}));

export const TabContent: React.FC<TabContentProps> = ({
  children,
  index,
  currentIndex,
  ...other
}) => {
  return (
    <TabContentDiv hidden={currentIndex !== index} {...other}>
      {currentIndex === index && children}
    </TabContentDiv>
  );
};
