/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import { Container, Link, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const StyledContainer = styled(Container)({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-end',
});

const Copyright: React.FC = () => (
  <Typography variant='body2' color='text.secondary'>
    {'Copyright © '}
    <Link color='inherit' href='https://eclipsesource.com' target='_blank'>
      EclipseSource
    </Link>{' '}
    {new Date().getFullYear()}
  </Typography>
);

export const Footer: React.FC = () => {
  return (
    <StyledContainer>
      <Copyright />
    </StyledContainer>
  );
};
