/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import React from 'react';
import { styled } from '@mui/material/styles';

const StyledContainer = styled(Container)({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-end',
});

export const Footer: React.FC = () => {
  return (
    <StyledContainer>
      <Typography variant='body2' color='textSecondary'>
        {`Copyright © ${new Date().getFullYear()}`}
      </Typography>
    </StyledContainer>
  );
};
