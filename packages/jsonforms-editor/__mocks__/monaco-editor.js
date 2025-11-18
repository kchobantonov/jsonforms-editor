// __mocks__/monaco-editor.js
// Minimal mock that satisfies react-monaco-editor
const monaco = {
  editor: {
    create: jest.fn(),
    createModel: jest.fn(),
    setModelLanguage: jest.fn(),
    setTheme: jest.fn(),
    defineTheme: jest.fn(),
    onDidChangeModelContent: jest.fn(),
    getModelMarkers: jest.fn(() => []),
  },
  languages: {
    register: jest.fn(),
    setMonarchTokensProvider: jest.fn(),
    setLanguageConfiguration: jest.fn(),
  },
  KeyCode: {},
  KeyMod: {},
  Range: class Range {},
  Position: class Position {},
};

module.exports = monaco;
