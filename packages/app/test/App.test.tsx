/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // for matchers like toBeInTheDocument
import React from 'react';

import { App } from '../src/App';

test('renders header', () => {
  // Render the component
  render(<App />);

  // Assert that the header text is present
  const titleElement = screen.getByText(/JSON Forms Editor/i);
  expect(titleElement).toBeInTheDocument();
});
