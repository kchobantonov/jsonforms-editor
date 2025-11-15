/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import React from 'react';
import { styled } from '@mui/material/styles';

interface LayoutProps {
  HeaderComponent?: React.ComponentType;
  FooterComponent?: React.ComponentType;
}

const Container = styled('div')({
  display: 'grid',
  height: '100vh',
  gridTemplateAreas: '"header" "content" "footer"',
  gridTemplateColumns: '1fr',
  gridTemplateRows: 'auto 1fr auto',
});

const Main = styled('main')(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  minHeight: 0,
}));

const Footer = styled('footer')(({ theme }) => ({
  padding: theme.spacing(2, 2),
  backgroundColor:
    theme.palette.mode === 'light'
      ? theme.palette.grey[200]
      : theme.palette.grey[800],
}));

export const Layout: React.FC<React.PropsWithChildren<LayoutProps>> = ({
  HeaderComponent,
  FooterComponent,
  children,
}) => {
  return (
    <Container>
      <header>{HeaderComponent ? <HeaderComponent /> : null}</header>
      <Main>{children}</Main>
      {FooterComponent ? (
        <Footer>
          <FooterComponent />
        </Footer>
      ) : (
        <footer />
      )}
    </Container>
  );
};
