/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
export const copyToClipBoard = async (text: string) => {
  try {
    // Try modern Clipboard API first
    await navigator.clipboard?.writeText(text);
    return;
  } catch {
    // fallback below if Clipboard API fails or is unavailable
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed'; // avoid scrolling
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback: Unable to copy', err);
  }

  document.body.removeChild(textArea);
};
