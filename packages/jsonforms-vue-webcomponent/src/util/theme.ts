export const getLightDarkTheme = (
  dark: boolean,
  currentTheme: string,
  exists: (theme: string) => boolean
) => {
  if (!currentTheme || !exists(currentTheme)) {
    // fallback to default
    return dark ? 'dark' : 'light';
  }

  // Determine if currentTheme is dark
  const isCurrentDark =
    currentTheme.endsWith('Dark') || currentTheme.includes('dark');

  // If the theme already matches the desired mode, return it
  if ((dark && isCurrentDark) || (!dark && !isCurrentDark)) {
    return currentTheme;
  }

  let newTheme: string;

  if (dark) {
    // Switching to dark mode
    if (currentTheme.endsWith('Light')) {
      newTheme = currentTheme.replace('Light', 'Dark');
    } else if (currentTheme.includes('light')) {
      newTheme = currentTheme.replace('light', 'dark');
    } else {
      const darkVariant = currentTheme + 'Dark';
      newTheme = exists(darkVariant) ? darkVariant : 'dark';
    }
  } else {
    // Switching to light mode
    if (currentTheme.endsWith('Dark')) {
      const baseTheme = currentTheme.replace('Dark', '');
      const lightVariant = baseTheme + 'Light';
      newTheme = exists(lightVariant)
        ? lightVariant
        : exists(baseTheme)
        ? baseTheme
        : 'light';
    } else if (currentTheme.includes('dark')) {
      newTheme = currentTheme.replace('dark', 'light');
    } else {
      // Already light
      newTheme = currentTheme;
    }
  }

  // Final fallback
  if (!exists(newTheme)) {
    newTheme = dark ? 'dark' : 'light';
  }

  return newTheme;
};
